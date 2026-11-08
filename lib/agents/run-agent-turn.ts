import OpenAI from "openai";
import type { ConversationKind } from "@/lib/db/types";
import { getRecentMessages } from "@/lib/db/messages";
import { getProfile } from "@/lib/db/profile";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import { buildGrillSystemPrompt } from "./grill-system-prompt";
import { buildIconGrillSystemPrompt } from "./icon-grill-system-prompt";
import { buildSvgGrillSystemPrompt } from "./svg-grill-system-prompt";
import {
  fallbackAgentReply,
  parseAgentReplyJson,
  type AgentReply,
} from "./types";

function resolveKind(kind?: ConversationKind): ConversationKind {
  if (kind === "icon" || kind === "svg") return kind;
  return "image";
}

export async function runAgentTurn(input: {
  conversationId: string;
  userPrompt: string;
  locale: "en" | "zh";
  forceSkip: boolean;
  kind?: ConversationKind;
}): Promise<{ reply: AgentReply; agentModel: string }> {
  const env = getEnv();
  if (!env.poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  const agentModel = env.agentModel;
  const profile = getProfile();
  const recent = getRecentMessages(input.conversationId, env.contextLimit);
  const kind = resolveKind(input.kind);

  const systemPrompt =
    kind === "icon"
      ? buildIconGrillSystemPrompt(input.locale)
      : kind === "svg"
        ? buildSvgGrillSystemPrompt(input.locale)
        : buildGrillSystemPrompt(input.locale);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (profile.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: `User style preferences:\n${profile.systemPrompt.trim()}`,
    });
  }

  if (input.forceSkip) {
    const skipHint =
      kind === "icon"
        ? "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt and suggestedSizes (default [16,32,64] if unknown) from known information, and list assumptions."
        : kind === "svg"
          ? "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt for a monochrome currentColor SVG icon, leave suggestedSizes empty, and list assumptions."
          : "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt from known information, and list assumptions.";
    messages.push({ role: "system", content: skipHint });
  }

  for (const msg of recent) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  const last = messages[messages.length - 1];
  if (!(last?.role === "user" && last.content === input.userPrompt)) {
    messages.push({ role: "user", content: input.userPrompt });
  }

  const client = new OpenAI({
    apiKey: requirePoeApiKey(),
    baseURL: env.poeBaseUrl,
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: agentModel,
      stream: false,
      messages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent request failed";
    throw Object.assign(new Error(message), { code: "POE_UPSTREAM" });
  }

  const content = completion.choices[0]?.message?.content;
  const raw = typeof content === "string" ? content : "";
  let reply = parseAgentReplyJson(raw) ?? fallbackAgentReply(raw);

  if (input.forceSkip) {
    const defaultPrompt =
      kind === "icon"
        ? "simple flat app icon, transparent background, centered"
        : kind === "svg"
          ? "simple flat monochrome app icon, suitable for currentColor SVG"
          : "game art concept, clear subject, clean composition";
    reply = {
      ...reply,
      readyToGenerate: true,
      suggestedPrompt:
        reply.suggestedPrompt.trim() || input.userPrompt.trim() || defaultPrompt,
      suggestedSizes:
        kind === "icon" && !reply.suggestedSizes.length
          ? [16, 32, 64]
          : kind === "svg"
            ? []
            : reply.suggestedSizes,
    };
  }

  if (reply.readyToGenerate && !reply.suggestedPrompt.trim()) {
    reply = { ...reply, readyToGenerate: false };
  }

  if (reply.clarifyingQuestions.length > 4) {
    reply = {
      ...reply,
      clarifyingQuestions: reply.clarifyingQuestions.slice(0, 4),
    };
  }

  return { reply, agentModel };
}
