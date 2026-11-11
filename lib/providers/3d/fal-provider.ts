import { getImageProvider } from "@/lib/providers/poe";
import { getEnv } from "@/lib/env";
import { isValidGlbBuffer } from "./http-provider";
import { getLiveEnvValue } from "./index";
import type {
  ThreeDGenerateOptions,
  ThreeDGenerateResult,
  ThreeDProvider,
} from "./types";

export class FalAi3DProvider implements ThreeDProvider {
  readonly name = "fal_ai";
  private falKey?: string;
  private endpoint: string;
  private timeoutMs: number;

  constructor(config?: {
    falKey?: string;
    endpoint?: string;
    timeoutMs?: number;
  }) {
    this.falKey =
      config?.falKey ||
      process.env.FAL_KEY ||
      getLiveEnvValue("FAL_KEY") ||
      undefined;
    this.endpoint =
      config?.endpoint ||
      process.env.FAL_3D_ENDPOINT ||
      "https://fal.run/fal-ai/trellis";
    this.timeoutMs = config?.timeoutMs ?? 180000;
  }

  /**
   * Two-stage helper: Generates an orthographic reference image via Poe if none is provided.
   */
  private async ensureReferenceImageUrl(
    options: ThreeDGenerateOptions,
  ): Promise<string> {
    if (options.imageUrl) {
      return options.imageUrl;
    }

    const env = getEnv();
    if (!env.poeConfigured) {
      throw new Error(
        "Poe API key is not configured. 3D generation requires an input reference image generated via Poe.",
      );
    }

    const categoryHint =
      options.category === "character"
        ? "standing in A-pose facing camera, full body visible"
        : options.category === "foliage"
          ? "isolated plant on neutral backdrop"
          : "single game asset prop, centered";

    const enhancedPrompt = `${options.prompt}, ${categoryHint}, studio product lighting, centered orthographic front view, pure plain clean white background, high contrast, clean silhouette, sharp focus, 3D model concept art`;

    const poeProvider = getImageProvider();
    const poeResult = await poeProvider.generate({
      model: "GPT-Image-1.5",
      messages: [{ role: "user", content: enhancedPrompt }],
    });

    const firstUrl = poeResult.imageUrls[0];
    if (!firstUrl) {
      throw new Error(
        "Poe failed to generate a 2D reference image for 3D reconstruction.",
      );
    }

    return firstUrl;
  }

  async generate(options: ThreeDGenerateOptions): Promise<ThreeDGenerateResult> {
    if (!this.falKey) {
      throw new Error(
        "FAL_KEY is not configured in .env. Please set FAL_KEY to use fal.ai 3D generation.",
      );
    }

    const imageUrl = await this.ensureReferenceImageUrl(options);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          texture_size: 1024,
          mesh_simplify: 0.95,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`fal.ai request failed: ${msg}`);
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(
        `fal.ai 3D generation failed (${res.status} ${res.statusText}): ${errBody.slice(0, 300)}`,
      );
    }

    const data = (await res.json()) as {
      model_mesh?: { url?: string };
    };

    const glbUrl = data.model_mesh?.url;
    if (!glbUrl) {
      throw new Error(
        `fal.ai completed successfully but no model_mesh.url found in output: ${JSON.stringify(
          data,
        ).slice(0, 200)}`,
      );
    }

    const glbRes = await fetch(glbUrl);
    if (!glbRes.ok) {
      throw new Error(
        `Failed to download GLB file from fal.ai: ${glbRes.statusText}`,
      );
    }

    const arrayBuf = await glbRes.arrayBuffer();
    const glbBuffer = Buffer.from(arrayBuf);

    if (!isValidGlbBuffer(glbBuffer)) {
      throw new Error(
        "Invalid GLB binary received from fal.ai: missing glTF magic header",
      );
    }

    return {
      glbBuffer,
      format: "glb",
      metadata: {
        category: options.category ?? "prop",
        style: options.style ?? "low-poly",
        provider: `fal_ai (${this.endpoint.split("/").slice(-2).join("/")})`,
        prompt: options.prompt,
        byteSize: glbBuffer.length,
      },
    };
  }
}

