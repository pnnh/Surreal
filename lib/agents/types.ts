import { z } from "zod";

export const agentReplySchema = z.object({
  assistantMessage: z.string().min(1),
  clarifyingQuestions: z.array(z.string()).max(4).default([]),
  suggestedPrompt: z.string().default(""),
  suggestedSizes: z.array(z.number().int().positive()).max(12).default([]),
  readyToGenerate: z.boolean().default(false),
  assumptions: z.array(z.string()).default([]),
});

export type AgentReply = z.infer<typeof agentReplySchema>;

export type AgentMessageMeta = AgentReply & {
  kind: "agent_reply";
  agentModel?: string;
};

export type UserMessageMeta = {
  kind: "user";
  skipClarification?: boolean;
};

export type ImageResultMeta = {
  kind: "image_result";
  imagePrompt?: string;
  sizes?: number[];
  assetType?: "image" | "icon";
};

export type MessageMeta = AgentMessageMeta | UserMessageMeta | ImageResultMeta;

export function parseAgentReplyJson(raw: string): AgentReply | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    const parsed: unknown = JSON.parse(candidate);
    const result = agentReplySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function fallbackAgentReply(rawText: string): AgentReply {
  return {
    assistantMessage:
      rawText.trim() ||
      "I need a bit more detail before generating. What subject, style, and view do you want?",
    clarifyingQuestions: [],
    suggestedPrompt: "",
    suggestedSizes: [],
    readyToGenerate: false,
    assumptions: [],
  };
}
