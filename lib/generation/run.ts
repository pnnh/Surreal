import {
  getConversation,
  touchConversation,
} from "@/lib/db/conversations";
import { insertMessage } from "@/lib/db/messages";
import { getProfile } from "@/lib/db/profile";
import type { Asset, Message } from "@/lib/db/types";
import { getEnv } from "@/lib/env";
import { resolveModelId } from "@/lib/models/allowlist";
import { getImageProvider } from "@/lib/providers/poe";
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
}): Promise<GenerateResult> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw Object.assign(new Error("prompt is required"), { code: "BAD_REQUEST" });
  }
  if (!getEnv().poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  const conversation = getConversation(input.conversationId);
  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { code: "NOT_FOUND" });
  }

  if (!tryAcquireGenerationLock(conversation.id)) {
    throw Object.assign(
      new Error("A generation is already in progress for this conversation"),
      { code: "BUSY" },
    );
  }

  try {
    const profile = getProfile();
    const model = resolveModelId(
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
        model,
      });
    } else {
      touchConversation(conversation.id, { model });
    }

    // Gated confirm/skip: send only the final image prompt (avoid grill chatter).
    // Legacy-style calls without source keep conversational context.
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
        meta: { kind: "image_result", imagePrompt: prompt },
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
      meta: { kind: "image_result", imagePrompt: prompt },
    });

    const assets = await persistGeneratedImages({
      urls: result.imageUrls,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      prompt,
      model,
    });

    assistantMessage.assetIds = assets.map((a) => a.id);
    assistantMessage.assets = assets.map((a) => ({
      id: a.id,
      favorite: a.favorite,
      fileUrl: a.fileUrl,
    }));
    return { userMessage, assistantMessage, assets };
  } finally {
    releaseGenerationLock(conversation.id);
  }
}
