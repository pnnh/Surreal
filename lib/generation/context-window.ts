import { getRecentMessages } from "@/lib/db/messages";
import { getProfile } from "@/lib/db/profile";
import { getEnv } from "@/lib/env";
import type { ChatMessage } from "@/lib/providers/types";

export function buildGenerationMessages(input: {
  conversationId: string;
  prompt: string;
}): ChatMessage[] {
  const profile = getProfile();
  const limit = getEnv().contextLimit;
  // Exclude the just-inserted current user message from "recent" by taking limit-1 then appending prompt,
  // or take recent after insert including current — caller inserts user message first.
  const recent = getRecentMessages(input.conversationId, limit);
  const messages: ChatMessage[] = [];

  if (profile.systemPrompt.trim()) {
    messages.push({ role: "system", content: profile.systemPrompt.trim() });
  }

  for (const msg of recent) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure the latest prompt is present (if recent already includes it, avoid duplicate)
  const last = messages[messages.length - 1];
  if (!(last?.role === "user" && last.content === input.prompt)) {
    messages.push({ role: "user", content: input.prompt });
  }

  return messages;
}
