export type GenerationProfile = {
  id: "default";
  systemPrompt: string;
  defaultModel: string;
  updatedAt: string;
};

export type ConversationSource = "web" | "mcp";

export type ConversationKind = "general" | "image" | "icon" | "svg" | "model";

export type SubagentType = "image" | "icon" | "svg" | "model" | "3d";

export type SubagentTaskStatus =
  | "in_grill"
  | "ready"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type SubagentTask = {
  id: string;
  conversationId: string;
  subagentType: SubagentType;
  status: SubagentTaskStatus;
  clarifyingQuestions: string[];
  suggestedPrompt: string;
  suggestedSizes?: number[];
  modelCategory?: string;
  modelStyle?: string;
  assetIds?: string[];
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetType = "image" | "icon" | "svg" | "model";

export type Conversation = {
  id: string;
  title: string | null;
  model: string;
  source: ConversationSource;
  kind: ConversationKind;
  activeTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageAssetSummary = {
  id: string;
  favorite: boolean;
  fileUrl: string;
  assetType?: AssetType;
  mimeType?: string;
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
  assetType: AssetType;
  createdAt: string;
  fileUrl: string;
};

export function assetFileUrl(id: string): string {
  return `/api/assets/${id}/file`;
}
