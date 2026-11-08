import { createConversation } from "@/lib/db/conversations";
import { getAsset } from "@/lib/db/assets";
import { runGeneration } from "@/lib/generation/run";
import { resolveModelId } from "@/lib/models/allowlist";
import path from "node:path";
import { getEnv } from "@/lib/env";

export async function mcpGenerateImage(input: {
  prompt: string;
  model?: string;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }

  const model = resolveModelId(input.model);
  const conversation = createConversation({
    title: prompt.slice(0, 80),
    model,
    source: "mcp",
  });

  const result = await runGeneration({
    conversationId: conversation.id,
    prompt,
    model,
    recordUserMessage: true,
    source: "skip",
  });

  const env = getEnv();
  const assets = result.assets.map((a) => {
    const full = getAsset(a.id);
    return {
      id: a.id,
      fileUrl: a.fileUrl,
      favorite: a.favorite,
      mimeType: a.mimeType,
      absolutePath: full
        ? path.join(env.dataDir, "assets", full.storageKey)
        : null,
      prompt: a.prompt,
      model: a.model,
    };
  });

  return {
    conversationId: conversation.id,
    assistantMessageId: result.assistantMessage.id,
    assets,
  };
}
