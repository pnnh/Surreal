export type ModelCategory = "character" | "prop" | "hard_surface" | "foliage";

export type ModelStyle = "low-poly" | "pbr" | "stylized";

export interface ThreeDGenerateOptions {
  prompt: string;
  category?: ModelCategory;
  style?: ModelStyle;
  seed?: number;
  imageUrl?: string;
  timeoutMs?: number;
}

export interface ThreeDGenerateResult {
  glbBuffer: Buffer;
  format: "glb";
  metadata?: {
    category?: ModelCategory;
    style?: ModelStyle;
    provider: string;
    prompt: string;
    seed?: number;
    byteSize: number;
    [key: string]: unknown;
  };
}

export interface ThreeDProvider {
  readonly name: string;
  generate(options: ThreeDGenerateOptions): Promise<ThreeDGenerateResult>;
}

