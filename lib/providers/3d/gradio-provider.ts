import { Client } from "@gradio/client";
import { getImageProvider } from "@/lib/providers/poe";
import { getEnv } from "@/lib/env";
import { isValidGlbBuffer } from "./http-provider";
import type {
  ThreeDGenerateOptions,
  ThreeDGenerateResult,
  ThreeDProvider,
} from "./types";

export class GradioSpace3DProvider implements ThreeDProvider {
  readonly name = "hf_space";
  private spaceId: string;
  private token?: string;
  private timeoutMs: number;

  constructor(config?: {
    spaceId?: string;
    token?: string;
    timeoutMs?: number;
  }) {
    // Default to Hunyuan3D-2.1 or Trellis
    this.spaceId =
      config?.spaceId ||
      process.env.HF_SPACE_ID ||
      "tencent/Hunyuan3D-2.1";
    this.token = config?.token || process.env.HF_TOKEN;
    this.timeoutMs = config?.timeoutMs ?? 180000; // 3 min
  }

  /**
   * Two-stage helper: Generates an orthographic reference image via Poe if none is provided.
   */
  private async ensureReferenceImageBlob(options: ThreeDGenerateOptions): Promise<Blob> {
    if (options.imageUrl) {
      const res = await fetch(options.imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch input image: ${res.statusText}`);
      }
      return await res.blob();
    }

    const env = getEnv();
    if (!env.poeConfigured) {
      throw new Error(
        "Poe API key is not configured. Hugging Face 3D Space requires an input reference image generated via Poe.",
      );
    }

    // Enhance prompt for clean 3D reconstruction reference
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
      throw new Error("Poe failed to generate a 2D reference image for 3D reconstruction.");
    }

    const imgRes = await fetch(firstUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download 2D reference image: ${imgRes.statusText}`);
    }

    return await imgRes.blob();
  }

  async generate(options: ThreeDGenerateOptions): Promise<ThreeDGenerateResult> {
    const imageBlob = await this.ensureReferenceImageBlob(options);

    let client: Client;
    try {
      client = await Client.connect(this.spaceId, {
        token: this.token as `hf_${string}` | undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Hugging Face Space (${this.spaceId}): ${msg}`);
    }

    // Execute predict with timeout
    const seed = options.seed ?? Math.floor(Math.random() * 1000000);
    let predictPromise: Promise<{ data: unknown[] }>;

    if (this.spaceId.includes("Hunyuan3D")) {
      // Endpoint /generation_all for Hunyuan3D-2.1
      predictPromise = client.predict("/generation_all", [
        null, // state
        imageBlob, // image
        null, // mv_front
        null, // mv_back
        null, // mv_left
        null, // mv_right
        20, // steps
        5, // guidance_scale
        seed, // seed
        256, // octree_resolution
        true, // check_box_rembg
        8000, // num_chunks
        true, // randomize_seed
      ]) as Promise<{ data: unknown[] }>;
    } else {
      // Endpoint /generate_and_extract_glb for TRELLIS
      predictPromise = client.predict("/generate_and_extract_glb", {
        image: imageBlob,
        multiimages: [],
        seed,
        ss_guidance_strength: 7.5,
        ss_sampling_steps: 12,
        slat_guidance_strength: 3,
        slat_sampling_steps: 12,
        multiimage_algo: "stochastic",
        mesh_simplify: 0.95,
        texture_size: 1024,
      }) as Promise<{ data: unknown[] }>;
    }

    // Await predict with timeout guard
    const timeoutPromise = new Promise<{ data: unknown[] }>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Hugging Face Space (${this.spaceId}) timed out after ${Math.round(
                this.timeoutMs / 1000,
              )}s. The public ZeroGPU queue may be congested.`,
            ),
          ),
        this.timeoutMs,
      ),
    );

    const result = await Promise.race([predictPromise, timeoutPromise]);

    if (!result?.data || !Array.isArray(result.data)) {
      throw new Error(
        `Invalid response from Hugging Face Space (${this.spaceId}): no data returned`,
      );
    }

    // Locate the glb file in return data
    // In Hunyuan3D: data[0] is File object { url: ..., path: ... }
    // In Trellis: data[1] or data[2] is File object
    let fileItem: { url?: string; path?: string } | null = null;
    for (const item of result.data) {
      if (item && typeof item === "object") {
        const candidate = item as { url?: string; path?: string };
        const pathOrUrl = candidate.url || candidate.path;
        if (
          typeof pathOrUrl === "string" &&
          (pathOrUrl.endsWith(".glb") || pathOrUrl.includes("glb"))
        ) {
          fileItem = candidate;
          break;
        }
      }
    }

    // Fallback: check first object with url
    if (!fileItem) {
      fileItem =
        (result.data.find((item) => {
          if (!item || typeof item !== "object") return false;
          const candidate = item as { url?: string; path?: string };
          return Boolean(candidate.url || candidate.path);
        }) as { url?: string; path?: string } | undefined) ?? null;
    }

    const downloadUrl = fileItem?.url || fileItem?.path;
    if (!downloadUrl) {
      throw new Error(
        `Hugging Face Space completed but no GLB download URL found in output: ${JSON.stringify(
          result.data,
        ).slice(0, 300)}`,
      );
    }

    const glbRes = await fetch(downloadUrl);
    if (!glbRes.ok) {
      throw new Error(`Failed to download GLB file from Hugging Face: ${glbRes.statusText}`);
    }

    const arrayBuf = await glbRes.arrayBuffer();
    const glbBuffer = Buffer.from(arrayBuf);

    if (!isValidGlbBuffer(glbBuffer)) {
      throw new Error(
        `Invalid GLB binary received from Hugging Face Space: missing glTF magic header`,
      );
    }

    return {
      glbBuffer,
      format: "glb",
      metadata: {
        category: options.category ?? "prop",
        style: options.style ?? "low-poly",
        provider: `hf_space (${this.spaceId})`,
        prompt: options.prompt,
        seed,
        byteSize: glbBuffer.length,
      },
    };
  }
}

