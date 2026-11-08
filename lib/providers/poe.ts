import OpenAI from "openai";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import { extractImageUrlsFromCompletion } from "./extract-images";
import type { ChatMessage, ImageGenerationResult, ImageProvider } from "./types";

export class PoeProvider implements ImageProvider {
  async generate(input: {
    model: string;
    messages: ChatMessage[];
  }): Promise<ImageGenerationResult> {
    const env = getEnv();
    const client = new OpenAI({
      apiKey: requirePoeApiKey(),
      baseURL: env.poeBaseUrl,
    });

    const completion = await client.chat.completions.create({
      model: input.model,
      messages: input.messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: false,
    });

    const extracted = extractImageUrlsFromCompletion(completion);
    return {
      text: extracted.text,
      imageUrls: extracted.imageUrls,
      raw: completion,
    };
  }
}

export function getImageProvider(): ImageProvider {
  return new PoeProvider();
}
