import type {
  ThreeDGenerateOptions,
  ThreeDGenerateResult,
  ThreeDProvider,
} from "./types";

export const GLB_MAGIC = "glTF"; // 0x46546C67

/**
 * Validates whether a buffer starts with standard glTF 2.0 Binary header
 */
export function isValidGlbBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return buf.subarray(0, 4).toString("ascii") === GLB_MAGIC;
}

export class CustomHttp3DProvider implements ThreeDProvider {
  readonly name = "custom_http";
  private apiUrl: string;
  private apiKey?: string;
  private defaultTimeoutMs: number;

  constructor(config?: {
    apiUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
  }) {
    this.apiUrl =
      config?.apiUrl ||
      process.env.THREE_D_API_URL ||
      "http://127.0.0.1:8000";
    this.apiKey = config?.apiKey || process.env.THREE_D_API_KEY;
    this.defaultTimeoutMs = config?.timeoutMs ?? 180000; // 3 min default
  }

  async generate(options: ThreeDGenerateOptions): Promise<ThreeDGenerateResult> {
    const endpoint = this.apiUrl.replace(/\/+$/, "") + "/generate";
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "model/gltf-binary, application/octet-stream, application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const payload = {
      prompt: options.prompt,
      category: options.category ?? "prop",
      style: options.style ?? "low-poly",
      seed: options.seed,
      image_url: options.imageUrl,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to 3D HTTP Provider (${endpoint}): ${msg}`);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `3D HTTP Provider returned HTTP ${response.status}: ${errText.slice(0, 300)}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    let glbBuffer: Buffer;

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as {
        glb_base64?: string;
        glb_url?: string;
        error?: string;
      };
      if (json.error) {
        throw new Error(`3D HTTP Provider returned error: ${json.error}`);
      }
      if (json.glb_base64) {
        glbBuffer = Buffer.from(json.glb_base64, "base64");
      } else if (json.glb_url) {
        const downloadRes = await fetch(json.glb_url, {
          signal: AbortSignal.timeout(60000),
        });
        if (!downloadRes.ok) {
          throw new Error(
            `Failed to download GLB from URL returned by 3D provider: HTTP ${downloadRes.status}`,
          );
        }
        const ab = await downloadRes.arrayBuffer();
        glbBuffer = Buffer.from(ab);
      } else {
        throw new Error(
          "3D HTTP Provider returned JSON without glb_base64 or glb_url",
        );
      }
    } else {
      const arrayBuffer = await response.arrayBuffer();
      glbBuffer = Buffer.from(arrayBuffer);
    }

    // Validate glTF 2.0 Magic Header
    if (!isValidGlbBuffer(glbBuffer)) {
      throw new Error(
        `Invalid GLB file received from 3D HTTP Provider (${glbBuffer.length} bytes): missing 'glTF' header`,
      );
    }

    return {
      glbBuffer,
      format: "glb",
      metadata: {
        category: options.category ?? "prop",
        style: options.style ?? "low-poly",
        provider: "custom_http",
        prompt: options.prompt,
        seed: options.seed,
        byteSize: glbBuffer.length,
      },
    };
  }
}

