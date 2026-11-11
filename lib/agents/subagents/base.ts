import OpenAI from "openai";
import { getProfile } from "@/lib/db/profile";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import {
  fallbackAgentReply,
  parseAgentReplyJson,
  type AgentReply,
  type SubagentInput,
} from "../types";

export async function runSpecialistTurn(
  input: SubagentInput,
  systemPrompt: string,
  skipHint: string,
): Promise<{ reply: AgentReply; agentModel: string }> {
  const env = getEnv();
  if (!env.poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  const agentModel = env.agentModel;
  const profile = getProfile();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (profile.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: `User style preferences:\n${profile.systemPrompt.trim()}`,
    });
  }

  if (input.contextSummary?.trim()) {
    messages.push({
      role: "system",
      content: `Context from earlier conversation (style, palette, world setting):\n${input.contextSummary.trim()}`,
    });
  }

  if (input.forceSkip) {
    messages.push({ role: "system", content: skipHint });
  }

  if (input.taskHistory && input.taskHistory.length > 0) {
    for (const msg of input.taskHistory) {
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
    const defaultPrompt = reply.suggestedPrompt.trim() || input.userPrompt;
    reply = {
      ...reply,
      readyToGenerate: true,
      suggestedPrompt: defaultPrompt,
      assumptions:
        reply.assumptions.length > 0
          ? reply.assumptions
          : ["Generated from current input without additional clarification."],
    };
  }

  return { reply, agentModel };
}

