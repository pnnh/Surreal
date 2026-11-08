export type Locale = "en" | "zh";

export type Messages = {
  nav: {
    chat: string;
    assets: string;
    mcpSessions: string;
    settings: string;
    language: string;
  };
  mcp: {
    title: string;
    subtitle: string;
    empty: string;
    session: string;
    readOnly: string;
  };
  chat: {
    title: string;
    subtitle: string;
    sessions: string;
    newSession: string;
    untitled: string;
    emptySessions: string;
    model: string;
    customModel: string;
    missingKey: string;
    emptyHint: string;
    promptPlaceholder: string;
    send: string;
    generating: string;
    thinking: string;
    generateFailed: string;
    imageAlt: string;
    skipClarification: string;
    generateNow: string;
    suggestedPrompt: string;
    clarifyingQuestions: string;
    assumptions: string;
  };
  assets: {
    title: string;
    subtitle: string;
    favoritesOnly: string;
    refresh: string;
    loadFailed: string;
    favorite: string;
    unfavorite: string;
    delete: string;
    deleteConfirm: string;
    empty: string;
  };
  settings: {
    title: string;
    subtitle: string;
    systemPrompt: string;
    systemPromptPlaceholder: string;
    defaultModel: string;
    lastUpdated: string;
    save: string;
    reset: string;
    saved: string;
    saveFailed: string;
  };
};

export const messages: Record<Locale, Messages> = {
  en: {
    nav: {
      chat: "Chat",
      assets: "Assets",
      mcpSessions: "MCP",
      settings: "Settings",
      language: "Language",
    },
    mcp: {
      title: "MCP sessions",
      subtitle:
        "Read-only view of image sessions created via the MCP server. You can favorite images here.",
      empty: "No MCP sessions yet.",
      session: "Session",
      readOnly: "Read-only",
    },
    chat: {
      title: "Image agent",
      subtitle:
        "Clarify what you want with a lightweight grill-style agent, then generate game art.",
      sessions: "Sessions",
      newSession: "New",
      untitled: "Untitled session",
      emptySessions: "No sessions yet",
      model: "Image model",
      customModel: "Custom image model ID (optional)",
      missingKey: "POE_API_KEY is not set. See .env.example.",
      emptyHint:
        "Describe what you want. The agent will ask clarifying questions before generating.",
      promptPlaceholder: "Describe the game art you want…",
      send: "Send",
      generating: "Generating…",
      thinking: "Thinking…",
      generateFailed: "Generation failed",
      imageAlt: "Generated image",
      skipClarification: "Skip & generate",
      generateNow: "Generate now",
      suggestedPrompt: "Suggested prompt",
      clarifyingQuestions: "Clarifying questions",
      assumptions: "Assumptions",
    },
    assets: {
      title: "Asset library",
      subtitle: "Browse, favorite, or delete saved images.",
      favoritesOnly: "Favorites only",
      refresh: "Refresh",
      loadFailed: "Failed to load",
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      delete: "Delete",
      deleteConfirm:
        "Delete this asset? The local file will be removed and cannot be recovered.",
      empty: "No assets yet. Generate your first image in Chat.",
    },
    settings: {
      title: "Settings",
      subtitle:
        "Edit the global system prompt and default image model. Applies to new generations only.",
      systemPrompt: "Global system prompt",
      systemPromptPlaceholder:
        "Example: Always use a consistent anime game-asset style, clean lines, prefer transparent backgrounds.",
      defaultModel: "Default image model",
      lastUpdated: "Last updated:",
      save: "Save",
      reset: "Reset defaults (not saved yet)",
      saved: "Saved. New generations will use this profile.",
      saveFailed: "Failed to save",
    },
  },
  zh: {
    nav: {
      chat: "对话",
      assets: "资产库",
      mcpSessions: "MCP",
      settings: "设置",
      language: "语言",
    },
    mcp: {
      title: "MCP 会话",
      subtitle: "只读查看由 MCP 服务创建的生图会话，可在此收藏图片。",
      empty: "暂无 MCP 会话。",
      session: "会话",
      readOnly: "只读",
    },
    chat: {
      title: "生图 Agent",
      subtitle: "先用反向拷问澄清意图，确认后再生成游戏美术素材。",
      sessions: "会话",
      newSession: "新建",
      untitled: "未命名会话",
      emptySessions: "暂无会话",
      model: "生图模型",
      customModel: "自定义生图模型 ID（可选）",
      missingKey: "未配置 POE_API_KEY，请参考 .env.example",
      emptyHint: "描述你想要的内容。Agent 会先澄清，再调用生图模型。",
      promptPlaceholder: "描述你想生成的游戏美术素材…",
      send: "发送",
      generating: "生成中…",
      thinking: "思考中…",
      generateFailed: "生成失败",
      imageAlt: "生成图片",
      skipClarification: "跳过澄清并生成",
      generateNow: "立即生成",
      suggestedPrompt: "建议提示词",
      clarifyingQuestions: "澄清问题",
      assumptions: "假设",
    },
    assets: {
      title: "资产库",
      subtitle: "浏览、收藏或删除已落盘的生成图片。",
      favoritesOnly: "仅收藏",
      refresh: "刷新",
      loadFailed: "加载失败",
      favorite: "收藏",
      unfavorite: "取消收藏",
      delete: "删除",
      deleteConfirm: "确认删除该资产？将移除本地文件且不可恢复。",
      empty: "暂无资产。去对话页生成第一张图吧。",
    },
    settings: {
      title: "设置",
      subtitle: "编辑全局系统提示词与默认生图模型。仅影响之后的新生成。",
      systemPrompt: "全局系统提示词",
      systemPromptPlaceholder:
        "例如：始终使用一致的二次元游戏立绘风格，干净线条，透明背景优先。",
      defaultModel: "默认生图模型",
      lastUpdated: "上次更新：",
      save: "保存",
      reset: "恢复默认（未自动保存）",
      saved: "已保存。新的生成请求将使用此配置。",
      saveFailed: "保存失败",
    },
  },
};

export const LOCALE_STORAGE_KEY = "surreal.locale";

/** Browser language → locale. Default English unless zh*. */
export function detectBrowserLocale(
  language = typeof navigator !== "undefined" ? navigator.language : "en",
): Locale {
  const base = language.toLowerCase().split("-")[0];
  return base === "zh" ? "zh" : "en";
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "zh";
}
