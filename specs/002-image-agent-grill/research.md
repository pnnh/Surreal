# Research: 轻量生图 Agent

## 1. 对话路由拆分

**Decision**: `POST /api/chat` 处理用户文本 → Agent；`POST /api/generate` 仅在确认/跳过后门闩生图。

**Rationale**: 从协议层保证「确认前不生图」（SC-001）；避免旧 `/api/generate` 被 UI 误用为默认发送。

**Alternatives considered**: 同一 endpoint 用 `mode` 字段——易回归直接生图。

## 2. Agent 结构化输出

**Decision**: 要求模型返回 JSON（可包在 \`\`\`json 中），zod 校验：

```ts
{
  assistantMessage: string,      // 对用户可见的自然语言
  clarifyingQuestions: string[], // 0–4
  suggestedPrompt: string,       // 英文生图提示词草案，可空
  readyToGenerate: boolean,
  assumptions: string[]          // 可选，跳过时列出假设
}
```

解析失败：把原文当 `assistantMessage`，`readyToGenerate=false`，`clarifyingQuestions=[]`，**不生图**。

**Rationale**: UI 需要稳定的「立即生成」门闩；纯自然语言难可靠检测。

**Alternatives considered**: 工具调用/function calling——Poe 兼容层参差；先 JSON 更稳。

## 3. Grill 行为（对齐 grill-me 精髓）

**Decision**: 系统提示编码：分轮澄清、每轮 2–4 相关问题、给建议提示词、用户主导、可被跳过打断；不做 40+ 问马拉松；不追「无法靠嘴解决」的审美细节到死。

**Rationale**: 用户引用 grill-me 要的是主动澄清，不是照搬技能全文。

## 4. 跳过澄清检测

**Decision**: UI 按钮发 `skipClarification: true`；同时用简单关键词/短语表检测自然语言（中英：直接生成、不要再问、just generate、skip、generate now 等）。命中则本轮强制 `readyToGenerate` 路径并触发生图（或返回 ready + 前端自动调 generate——**推荐服务端在 skip 时直接串联生图一次**，减少往返）。

**Rationale**: 规格要求双通道；skip 时用户期望尽快出图。

**Alternatives considered**: skip 只返回建议词再等一次确认——多余摩擦，与「强制」语义不符。

## 5. 确认后提示词来源

**Decision**: 「立即生成」请求体携带 `prompt`（来自该条 Agent 消息的 `suggestedPrompt`）。不以输入框当前内容覆盖，除非用户显式编辑并再次发送澄清。

**Rationale**: 规格假设：门闩携带提示词为准。

## 6. 默认模型

**Decision**: `SURREAL_AGENT_MODEL` 默认 `GPT-4o-Mini`；生图仍会话模型/`GPT-Image-1.5`。删除 `SURREAL_PROMPT_OPTIMIZER_MODEL` 旁路 UI（env 可保留暂时无用或删文档引用）。

**Rationale**: 澄清结论 A。

## 7. 消息持久化

**Decision**: assistant 消息 `content` 存对用户可见文本；另存 `meta_json`（或旁表）保存结构化 AgentReply，供 UI 渲染按钮与历史恢复。

**Rationale**: 刷新后仍能点「立即生成」。

## 8. 移除 ✨

**Decision**: 删除 ChatWorkspace 优化/撤销状态与 `/api/optimize-prompt` 的 UI 入口；API 可暂留但 UI 不可达，或直接删除以减面。

**Rationale**: 避免双路径；YAGNI 倾向删除 UI + 标记 API deprecated/删除。
