import path from "node:path";
import { createConversation } from "@/lib/db/conversations";
import { getAsset } from "@/lib/db/assets";
import { runGeneration } from "@/lib/generation/run";
import { getEnv } from "@/lib/env";
import { normalizeIconSizes } from "@/lib/icons/sizes";
import { resolveModelId } from "@/lib/models/allowlist";
import type { ModelCategory, ModelStyle } from "@/lib/providers/3d";

function mapAssets(
  assets: Awaited<ReturnType<typeof runGeneration>>["assets"],
) {
  const env = getEnv();
  return assets.map((a) => {
    const full = getAsset(a.id);
    return {
      id: a.id,
      fileUrl: a.fileUrl,
      favorite: a.favorite,
      mimeType: a.mimeType,
      width: a.width,
      height: a.height,
      absolutePath: full
        ? path.join(env.dataDir, "assets", full.storageKey)
        : null,
      prompt: a.prompt,
      model: a.model,
      assetType: a.assetType,
    };
  });
}

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
    kind: "image",
  });

  const result = await runGeneration({
    conversationId: conversation.id,
    prompt,
    model,
    recordUserMessage: true,
    source: "skip",
  });

  return {
    conversationId: conversation.id,
    assistantMessageId: result.assistantMessage.id,
    assets: mapAssets(result.assets),
  };
}

export async function mcpGenerateSvgIcon(input: {
  prompt: string;
  model?: string;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }

  const model = input.model?.trim() || getEnv().agentModel;
  const conversation = createConversation({
    title: prompt.slice(0, 80),
    model,
    source: "mcp",
    kind: "svg",
  });

  const result = await runGeneration({
    conversationId: conversation.id,
    prompt,
    model,
    recordUserMessage: true,
    source: "skip",
  });

  return {
    conversationId: conversation.id,
    assistantMessageId: result.assistantMessage.id,
    assets: mapAssets(result.assets),
  };
}

export async function mcpGenerateIcon(input: {
  prompt: string;
  sizes?: number[];
  model?: string;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }

  const { sizes } = normalizeIconSizes(input.sizes);
  const model = resolveModelId(input.model);
  const conversation = createConversation({
    title: prompt.slice(0, 80),
    model,
    source: "mcp",
    kind: "icon",
  });

  const result = await runGeneration({
    conversationId: conversation.id,
    prompt,
    model,
    recordUserMessage: true,
    source: "skip",
    sizes,
  });

  return {
    conversationId: conversation.id,
    assistantMessageId: result.assistantMessage.id,
    assets: mapAssets(result.assets),
  };
}

export async function mcpGenerate3DModel(input: {
  prompt: string;
  category?: ModelCategory;
  style?: ModelStyle;
  seed?: number;
  model?: string;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }

  const model = input.model?.trim() || "3d-model";
  const conversation = createConversation({
    title: prompt.slice(0, 80),
    model,
    source: "mcp",
    kind: "model",
  });

  const result = await runGeneration({
    conversationId: conversation.id,
    prompt,
    model,
    assetType: "model",
    modelCategory: input.category,
    modelStyle: input.style,
    recordUserMessage: true,
    source: "skip",
  });

  return {
    conversationId: conversation.id,
    assistantMessageId: result.assistantMessage.id,
    assets: mapAssets(result.assets),
  };
}
