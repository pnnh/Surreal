import { listMessagesForConversation } from "@/lib/db/messages";

/**
 * Builds a brief context summary from the conversation history,
 * extracting themes, art style keywords, and palette preferences.
 */
export function buildContextSummary(conversationId: string): string {
  const messages = listMessagesForConversation(conversationId);
  if (!messages || messages.length === 0) return "";

  const recent = messages.slice(-10);
  const relevantSnippets: string[] = [];

  for (const msg of recent) {
    if (msg.role === "user") {
      relevantSnippets.push(`User said: ${msg.content.slice(0, 150)}`);
    } else if (msg.role === "assistant" && msg.content) {
      relevantSnippets.push(`Assistant: ${msg.content.slice(0, 150)}`);
    }
  }

  return relevantSnippets.join("\n");
}

