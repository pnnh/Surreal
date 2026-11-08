export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<TextPart | ImageUrlPart>;
};

export type TextPart = { type: "text"; text: string };
export type ImageUrlPart = {
  type: "image_url";
  image_url: { url: string };
};

export type ImageGenerationResult = {
  text: string;
  imageUrls: string[];
  raw?: unknown;
};

export type ImageProvider = {
  generate(input: {
    model: string;
    messages: ChatMessage[];
  }): Promise<ImageGenerationResult>;
};
