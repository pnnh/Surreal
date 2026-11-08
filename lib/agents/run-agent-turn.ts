import OpenAI from "openai";
import { getRecentMessages } from "@/lib/db/messages";
import { getProfile } from "@/lib/db/profile";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import { buildGrillSystemPrompt } from "./grill-system-prompt";
import {
  fallbackAgentReply,
  parseAgentReplyJson,
  type AgentReply,
} from "./types";

export async function runAgentTurn(input: {
  conversationId: string;
  userPrompt: string;
  locale: "en" | "zh";
  forceSkip: boolean;
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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildGrillSystemPrompt(input.locale) },
  ];

  if (profile.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: `User style preferences:\n${profile.systemPrompt.trim()}`,
    });
  }

  if (input.forceSkip) {
    messages.push({
      role: "system",
      content:
        "The user requested to SKIP further clarification this turn. Set readyToGenerate=true, produce the best suggestedPrompt from known information, and list assumptions.",
    });
  }

  for (const msg of recent) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure latest user turn is present
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
    reply = {
      ...reply,
      readyToGenerate: true,
      suggestedPrompt:
        reply.suggestedPrompt.trim() ||
        input.userPrompt.trim() ||
        "game art concept, clear subject, clean composition",
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
