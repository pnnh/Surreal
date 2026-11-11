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
    deleteSession: string;
    deleteSessionConfirm: string;
    coordinatorBadge: string;
    untitled: string;
    emptySessions: string;
    model: string;
    customModel: string;
    missingKey: string;
    emptyHint: string;
    emptyHintIcon: string;
    emptyHintSvg: string;
    promptPlaceholder: string;
    promptPlaceholderIcon: string;
    promptPlaceholderSvg: string;
    send: string;
    generating: string;
    thinking: string;
    generateFailed: string;
    imageAlt: string;
    skipClarification: string;
    skipClarificationConfirm: string;
    generateNow: string;
    suggestedPrompt: string;
    suggestedSizes: string;
    clarifyingQuestions: string;
    assumptions: string;
    kindImage: string;
    kindIcon: string;
    kindSvg: string;
    kindModel: string;
    kindGeneral: string;
    specialistImage: string;
    specialistIcon: string;
    specialistSvg: string;
    specialistModel: string;
    taskWaitingUser: string;
    taskGenerating: string;
    taskCompleted: string;
    taskCancelled: string;
    emptyHintGeneral: string;
    promptPlaceholderGeneral: string;
    newKindHint: string;
    svgColor: string;
    svgSize: string;
    svgDownload: string;
    svgLoadFailed: string;
    modelCategory: string;
    modelStyle: string;
    modelDownload: string;
    modelRotateHelp: string;
    modelLoading: string;
    modelLoadFailed: string;
  };
  assets: {
    title: string;
    subtitle: string;
    favoritesOnly: string;
    typeFilter: string;
    typeAll: string;
    typeImage: string;
    typeIcon: string;
    typeSvg: string;
    typeModel: string;
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
      title: "Game Art Coordinator Agent",
      subtitle:
        "Unified Coordinator Agent delegates to specialized subagents for 2D game art, bitmap icons, SVG vector graphics, and 3D static models.",
      sessions: "Sessions",
      newSession: "New",
      deleteSession: "Delete session",
      deleteSessionConfirm: "Are you sure you want to delete this session?",
      coordinatorBadge: "Coordinator Agent",
      untitled: "Untitled session",
      emptySessions: "No sessions yet",
      model: "Image model",
      customModel: "Custom image model ID (optional)",
      missingKey: "POE_API_KEY is not set. See .env.example.",
      emptyHint:
        "Describe what you want. The agent will ask clarifying questions before generating.",
      emptyHintIcon:
        "Describe the icon (style, subject, sizes). The agent will clarify, then batch-generate bitmaps.",
      emptyHintSvg:
        "Describe a monochrome vector icon. The agent will clarify, then generate one CSS-colorable SVG.",
      promptPlaceholder: "Describe the game art you want…",
      promptPlaceholderIcon: "Describe the icon you want (e.g. cart, 32/64)…",
      promptPlaceholderSvg: "Describe the SVG icon (e.g. cart, monochrome)…",
      send: "Send",
      generating: "Generating…",
      thinking: "Thinking…",
      generateFailed: "Generation failed",
      imageAlt: "Generated image",
      skipClarification: "Skip & generate",
      skipClarificationConfirm:
        "Skip clarification and generate now? The result may be less accurate.",
      generateNow: "Generate now",
      suggestedPrompt: "Suggested prompt",
      suggestedSizes: "Suggested sizes",
      clarifyingQuestions: "Clarifying questions",
      assumptions: "Assumptions",
      kindImage: "Image",
      kindIcon: "Icon",
      kindSvg: "SVG",
      kindModel: "3D Model",
      kindGeneral: "Chat",
      specialistImage: "Image Specialist",
      specialistIcon: "Icon Specialist",
      specialistSvg: "SVG Specialist",
      specialistModel: "3D Specialist",
      taskWaitingUser: "Awaiting your clarification",
      taskGenerating: "Generating asset…",
      taskCompleted: "Task completed",
      taskCancelled: "Task cancelled",
      emptyHintGeneral:
        "Chat with the Coordinator Agent. Describe any game art, bitmap icon, SVG vector icon, or 3D static mesh.",
      promptPlaceholderGeneral:
        "Describe what you want (e.g. game character, potion icon, SVG icon, 3D model, or chat)…",
      newKindHint: "New sessions use the selected type above.",
      svgColor: "Color",
      svgSize: "Size",
      svgDownload: "Download",
      svgLoadFailed: "Failed to load SVG",
      modelCategory: "Category",
      modelStyle: "Style",
      modelDownload: "Download .glb",
      modelRotateHelp: "Drag to rotate, scroll to zoom",
      modelLoading: "Loading 3D model…",
      modelLoadFailed: "Failed to load 3D model",
    },
    assets: {
      title: "Asset library",
      subtitle: "Browse, favorite, or delete saved images, icons, SVGs, and 3D models.",
      favoritesOnly: "Favorites only",
      typeFilter: "Type",
      typeAll: "All",
      typeImage: "Images",
      typeIcon: "Icons",
      typeSvg: "SVG",
      typeModel: "3D Models",
      refresh: "Refresh",
      loadFailed: "Failed to load",
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      delete: "Delete",
      deleteConfirm:
        "Delete this asset? The local file will be removed and cannot be recovered.",
      empty: "No assets yet. Generate your first image or icon in Chat.",
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
      title: "游戏美术资产协同 Agent",
      subtitle:
        "由主 Agent 自动协同 2D 原画、位图图标、矢量 SVG 与 3D 静态模型专有子 Agent，反向澄清后精准出图出模。",
      sessions: "会话",
      newSession: "新建",
      deleteSession: "删除会话",
      deleteSessionConfirm: "确定删除此会话及其所有关联资产吗？",
      coordinatorBadge: "美术协同 Agent",
      untitled: "未命名会话",
      emptySessions: "暂无会话",
      model: "生图模型",
      customModel: "自定义生图模型 ID（可选）",
      missingKey: "未配置 POE_API_KEY，请参考 .env.example",
      emptyHint: "描述你想要的内容。Agent 会先澄清，再调用生图模型。",
      emptyHintIcon:
        "描述图标（风格、主体、尺寸）。Agent 会先澄清，再按尺寸批量生成位图。",
      emptyHintSvg:
        "描述单色矢量图标。Agent 会先澄清，再生成可用 CSS 换色/缩放的 SVG。",
      promptPlaceholder: "描述你想生成的游戏美术素材…",
      promptPlaceholderIcon: "描述想要的图标（例如购物车，32/64）…",
      promptPlaceholderSvg: "描述 SVG 图标（例如购物车、单色）…",
      send: "发送",
      generating: "生成中…",
      thinking: "思考中…",
      generateFailed: "生成失败",
      imageAlt: "生成图片",
      skipClarification: "跳过澄清并生成",
      skipClarificationConfirm:
        "确定跳过澄清并立即生成？结果可能不够精准。",
      generateNow: "立即生成",
      suggestedPrompt: "建议提示词",
      suggestedSizes: "建议尺寸",
      clarifyingQuestions: "澄清问题",
      assumptions: "假设",
      kindImage: "图片",
      kindIcon: "图标",
      kindSvg: "SVG",
      kindModel: "3D 模型",
      kindGeneral: "通用对话",
      specialistImage: "生图专家",
      specialistIcon: "图标专家",
      specialistSvg: "SVG 专家",
      specialistModel: "3D 模型专家",
      taskWaitingUser: "等待细节确认",
      taskGenerating: "正在协同生成资产…",
      taskCompleted: "任务已完成",
      taskCancelled: "任务已取消",
      emptyHintGeneral:
        "向主聊天 Agent 发送消息。直接用自然语言描述立绘、场景、位图图标、SVG 矢量图标或 3D 静态模型。",
      promptPlaceholderGeneral:
        "输入你想创作的资产（如画个法师立绘、药水图标、SVG购物车、3D木桶），或直接交流…",
      newKindHint: "新建会话将使用上方所选类型。",
      svgColor: "颜色",
      svgSize: "大小",
      svgDownload: "下载",
      svgLoadFailed: "SVG 加载失败",
      modelCategory: "类别",
      modelStyle: "风格",
      modelDownload: "下载 .glb",
      modelRotateHelp: "拖拽旋转，滚轮缩放",
      modelLoading: "正在加载 3D 模型…",
      modelLoadFailed: "3D 模型加载失败",
    },
    assets: {
      title: "资产库",
      subtitle: "浏览、收藏或删除已落盘的图片、图标、SVG 与 3D 模型。",
      favoritesOnly: "仅收藏",
      typeFilter: "类型",
      typeAll: "全部",
      typeImage: "图片",
      typeIcon: "图标",
      typeSvg: "SVG",
      typeModel: "3D 模型",
      refresh: "刷新",
      loadFailed: "加载失败",
      favorite: "收藏",
      unfavorite: "取消收藏",
      delete: "删除",
      deleteConfirm: "确认删除该资产？将移除本地文件且不可恢复。",
      empty: "暂无资产。去对话页生成第一张图或图标吧。",
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
