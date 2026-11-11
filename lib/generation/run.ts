import {
  getConversation,
  touchConversation,
} from "@/lib/db/conversations";
import { insertMessage } from "@/lib/db/messages";
import { getProfile } from "@/lib/db/profile";
import type { Asset, AssetType, Message } from "@/lib/db/types";
import { getEnv } from "@/lib/env";
import {
  appendIconSizeToPrompt,
  normalizeIconSizes,
} from "@/lib/icons/sizes";
import { resolveModelId } from "@/lib/models/allowlist";
import { getImageProvider } from "@/lib/providers/poe";
import {
  get3DProvider,
  type ModelCategory,
  type ModelStyle,
} from "@/lib/providers/3d";
import { generateSvgMarkup } from "@/lib/svg/generate";
import { persistSvgAsset } from "@/lib/svg/persist";
import { persistModelAsset } from "./persist-model";
import { buildGenerationMessages } from "./context-window";
import {
  releaseGenerationLock,
  tryAcquireGenerationLock,
} from "./inflight";
import { persistGeneratedImages } from "./persist";

export type GenerateResult = {
  userMessage: Message | null;
  assistantMessage: Message;
  assets: Asset[];
};

export async function runGeneration(input: {
  conversationId: string;
  prompt: string;
  model?: string;
  /** When false, do not insert a user message (already recorded by /api/chat). */
  recordUserMessage?: boolean;
  userMessageContent?: string;
  source?: "confirm" | "skip";
  sizes?: number[];
  assetType?: AssetType;
  modelCategory?: string;
  modelStyle?: string;
}): Promise<GenerateResult> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }

  const conversation = getConversation(input.conversationId);
  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { code: "NOT_FOUND" });
  }

  const assetType =
    input.assetType ||
    (conversation.kind === "icon"
      ? "icon"
      : conversation.kind === "svg"
        ? "svg"
        : conversation.kind === "model"
          ? "model"
          : "image");

  if (assetType !== "model" && !getEnv().poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  if (!tryAcquireGenerationLock(conversation.id)) {
    throw Object.assign(
      new Error("A generation is already in progress for this conversation"),
      { code: "BUSY" },
    );
  }

  try {
    const profile = getProfile();
    const env = getEnv();
    const isSvg = assetType === "svg";
    const isModel = assetType === "model";
    const model = isSvg
      ? input.model?.trim() || env.agentModel
      : isModel
        ? input.model?.trim() || "3d-model"
        : resolveModelId(
            input.model || conversation.model || profile.defaultModel,
          );

    const recordUser = input.recordUserMessage !== false;
    let userMessage: Message | null = null;
    if (recordUser) {
      userMessage = insertMessage({
        conversationId: conversation.id,
        role: "user",
        content: input.userMessageContent?.trim() || prompt,
        meta: {
          kind: "user",
          skipClarification: input.source === "skip",
        },
      });
    }

    if (!conversation.title) {
      touchConversation(conversation.id, {
        title: (input.userMessageContent || prompt).slice(0, 80),
        model: isSvg || isModel ? conversation.model : model,
      });
    } else if (!isSvg && !isModel) {
      touchConversation(conversation.id, { model });
    } else {
      touchConversation(conversation.id, {});
    }

    if (assetType === "model") {
      return await runModelGeneration({
        conversationId: conversation.id,
        prompt,
        model,
        category: input.modelCategory as ModelCategory | undefined,
        style: input.modelStyle as ModelStyle | undefined,
        userMessage,
      });
    }

    if (assetType === "svg") {
      return await runSvgGeneration({
        conversationId: conversation.id,
        prompt,
        model,
        systemPrompt: profile.systemPrompt,
        userMessage,
      });
    }

    if (assetType === "icon") {
      return await runIconBatch({
        conversationId: conversation.id,
        prompt,
        model,
        systemPrompt: profile.systemPrompt,
        sizes: input.sizes,
        userMessage,
        source: input.source,
      });
    }

    const messages =
      input.source === "confirm" || input.source === "skip"
        ? ([
            ...(profile.systemPrompt.trim()
              ? [
                  {
                    role: "system" as const,
                    content: profile.systemPrompt.trim(),
                  },
                ]
              : []),
            { role: "user" as const, content: prompt },
          ])
        : buildGenerationMessages({
            conversationId: conversation.id,
            prompt,
          });

    const provider = getImageProvider();
    let result;
    try {
      result = await provider.generate({ model, messages });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Poe request failed";
      throw Object.assign(new Error(message), { code: "POE_UPSTREAM" });
    }

    if (!result.imageUrls.length) {
      const assistantMessage = insertMessage({
        conversationId: conversation.id,
        role: "assistant",
        content:
          result.text ||
          "Model returned no image. Try another prompt or model.",
        model,
        meta: { kind: "image_result", imagePrompt: prompt, assetType: "image" },
      });
      throw Object.assign(new Error("Model returned no image attachment"), {
        code: "NO_IMAGE",
        userMessage,
        assistantMessage,
        assets: [] as Asset[],
      });
    }

    const assistantText =
      result.text?.trim() ||
      `Generated ${result.imageUrls.length} image(s) with ${model}.`;

    const assistantMessage = insertMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: assistantText,
      model,
      meta: { kind: "image_result", imagePrompt: prompt, assetType: "image" },
    });

    const assets = await persistGeneratedImages({
      urls: result.imageUrls,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      prompt,
      model,
      assetType: "image",
    });

    assistantMessage.assetIds = assets.map((a) => a.id);
    assistantMessage.assets = assets.map((a) => ({
      id: a.id,
      favorite: a.favorite,
      fileUrl: a.fileUrl,
      assetType: a.assetType,
      mimeType: a.mimeType,
    }));
    return { userMessage, assistantMessage, assets };
  } finally {
    releaseGenerationLock(conversation.id);
  }
}

async function runSvgGeneration(input: {
  conversationId: string;
  prompt: string;
  model: string;
  systemPrompt: string;
  userMessage: Message | null;
}): Promise<GenerateResult> {
  const brief = input.systemPrompt.trim()
    ? `${input.prompt}\n\nStyle preferences:\n${input.systemPrompt.trim()}`
    : input.prompt;

  const { svg, model } = await generateSvgMarkup({
    prompt: brief,
    model: input.model,
  });

  const assistantMessage = insertMessage({
    conversationId: input.conversationId,
    role: "assistant",
    content: `Generated SVG icon with ${model}.`,
    model,
    meta: {
      kind: "image_result",
      imagePrompt: input.prompt,
      assetType: "svg",
    },
  });

  const asset = await persistSvgAsset({
    svg,
    conversationId: input.conversationId,
    messageId: assistantMessage.id,
    prompt: input.prompt,
    model,
  });

  assistantMessage.assetIds = [asset.id];
  assistantMessage.assets = [
    {
      id: asset.id,
      favorite: asset.favorite,
      fileUrl: asset.fileUrl,
      assetType: asset.assetType,
      mimeType: asset.mimeType,
    },
  ];

  return {
    userMessage: input.userMessage,
    assistantMessage,
    assets: [asset],
  };
}

async function runIconBatch(input: {
  conversationId: string;
  prompt: string;
  model: string;
  systemPrompt: string;
  sizes?: number[];
  userMessage: Message | null;
  source?: "confirm" | "skip";
}): Promise<GenerateResult> {
  const { sizes, usedDefault } = normalizeIconSizes(input.sizes);
  const provider = getImageProvider();
  const assets: Asset[] = [];
  const failures: string[] = [];

  const assistantMessage = insertMessage({
    conversationId: input.conversationId,
    role: "assistant",
    content: `Generating ${sizes.length} icon size(s)${usedDefault ? " (using default 16/32/64)" : ""}…`,
    model: input.model,
    meta: {
      kind: "image_result",
      imagePrompt: input.prompt,
      sizes,
      assetType: "icon",
    },
  });

  for (const size of sizes) {
    const sizedPrompt = appendIconSizeToPrompt(input.prompt, size);
    const messages = [
      ...(input.systemPrompt.trim()
        ? [
            {
              role: "system" as const,
              content: `${input.systemPrompt.trim()}\nPrefer transparent backgrounds for icons.`,
            },
          ]
        : [
            {
              role: "system" as const,
              content:
                "Generate a flat UI/app icon with a transparent background, no photo realism, centered subject.",
            },
          ]),
      { role: "user" as const, content: sizedPrompt },
    ];

    try {
      const result = await provider.generate({
        model: input.model,
        messages,
      });
      if (!result.imageUrls.length) {
        failures.push(`${size}px: no image returned`);
        continue;
      }
      const saved = await persistGeneratedImages({
        urls: result.imageUrls.slice(0, 1),
        conversationId: input.conversationId,
        messageId: assistantMessage.id,
        prompt: sizedPrompt,
        model: input.model,
        assetType: "icon",
        width: size,
        height: size,
      });
      assets.push(...saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed";
      failures.push(`${size}px: ${message}`);
    }
  }

  if (!assets.length) {
    throw Object.assign(
      new Error(
        failures.length
          ? `Icon generation failed: ${failures.join("; ")}`
          : "Model returned no icon images",
      ),
      {
        code: "NO_IMAGE",
        userMessage: input.userMessage,
        assistantMessage,
        assets: [] as Asset[],
      },
    );
  }

  const okSizes = assets
    .map((a) => a.width)
    .filter((w): w is number => typeof w === "number");
  assistantMessage.content = [
    `Generated ${assets.length} icon(s) at ${okSizes.join(", ") || "requested"} px with ${input.model}.`,
    failures.length ? `Failed: ${failures.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  assistantMessage.assetIds = assets.map((a) => a.id);
  assistantMessage.assets = assets.map((a) => ({
    id: a.id,
    favorite: a.favorite,
    fileUrl: a.fileUrl,
    assetType: a.assetType,
    mimeType: a.mimeType,
  }));

  return {
    userMessage: input.userMessage,
    assistantMessage,
    assets,
  };
}

async function runModelGeneration(input: {
  conversationId: string;
  prompt: string;
  model: string;
  category?: ModelCategory;
  style?: ModelStyle;
  userMessage: Message | null;
}): Promise<GenerateResult> {
  const provider = get3DProvider();
  console.log(`[3D Generation] Active provider: ${provider.name}`);
  let result;
  try {
    result = await provider.generate({
      prompt: input.prompt,
      category: input.category,
      style: input.style,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "3D model generation failed";
    const isQuota = message.toLowerCase().includes("quota");
    throw Object.assign(new Error(message), {
      code: isQuota ? "THREE_D_QUOTA_EXCEEDED" : "THREE_D_GENERATION_FAILED",
    });
  }

  const assistantMessage = insertMessage({
    conversationId: input.conversationId,
    role: "assistant",
    content: `Generated 3D static model (.glb) for "${input.prompt}" using ${provider.name}.`,
    model: `${provider.name}-3d`,
    meta: {
      kind: "image_result",
      imagePrompt: input.prompt,
      assetType: "model",
      modelCategory: input.category,
      modelStyle: input.style,
    },
  });

  const asset = await persistModelAsset({
    glbBuffer: result.glbBuffer,
    conversationId: input.conversationId,
    messageId: assistantMessage.id,
    prompt: input.prompt,
    model: `${provider.name}-3d`,
  });

  assistantMessage.assetIds = [asset.id];
  assistantMessage.assets = [
    {
      id: asset.id,
      favorite: asset.favorite,
      fileUrl: asset.fileUrl,
      assetType: asset.assetType,
      mimeType: asset.mimeType,
    },
  ];

  return {
    userMessage: input.userMessage,
    assistantMessage,
    assets: [asset],
  };
}
