export type GenerationProfile = {
  id: "default";
  systemPrompt: string;
  defaultModel: string;
  updatedAt: string;
};

export type ConversationSource = "web" | "mcp";

export type Conversation = {
  id: string;
  title: string | null;
  model: string;
  source: ConversationSource;
  createdAt: string;
  updatedAt: string;
};

export type MessageAssetSummary = {
  id: string;
  favorite: boolean;
  fileUrl: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type MessageMeta = Record<string, unknown>;

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  model: string | null;
  sequence: number;
  createdAt: string;
  assetIds?: string[];
  assets?: MessageAssetSummary[];
  meta?: MessageMeta | null;
};

export type Asset = {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  prompt: string;
  model: string;
  mimeType: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  favorite: boolean;
  createdAt: string;
  fileUrl: string;
};

export function assetFileUrl(id: string): string {
  return `/api/assets/${id}/file`;
}
