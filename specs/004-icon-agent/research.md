# Research: 004-icon-agent

## 1. 位图图标 vs SVG

- **Decision**: MVP 仅位图（PNG/WebP），不做 SVG。
- **Rationale**: 现有 Poe ImageProvider 已能出图；SVG 需另建「代码生成 + 校验 + 预览」管线，超出本切片。澄清 Q1=A。
- **Alternatives**: LLM 写 SVG；外部矢量 API — 均后置。

## 2. 多尺寸生成策略

- **Decision**: 对话敲定 `sizes: number[]` 后，对每个尺寸各发起一次（或带 size 约束的）生图请求；提示词中显式写入目标像素边长与「app/web icon, transparent background」。
- **Rationale**: 澄清 Q2=B；本地缩放主图（选项 C）在小尺寸易糊，不符合图标用途。
- **Defaults when skipped**: `[16, 32, 64]`。
- **Cap**: 单批最多 12 个尺寸；非法值（非正整数、超大如 >2048）过滤并提示。
- **Alternatives**: 一次 API 出多图 — Poe/当前封装不保证按尺寸枚举，故用显式循环更可控。

## 3. 透明背景

- **Decision**: 在图标系统提示与最终 `suggestedPrompt` 中强制加入 transparent / alpha / no background 约束；落盘保留模型返回的 MIME（优先 PNG/WebP）。
- **Rationale**: 用户明确要求透明；模型能力不保证，规格为 best-effort。
- **Alternatives**: 后处理抠图 — MVP 不做。

## 4. 存储布局

- **Decision**: `storageKey = {conversationId}/{images|icons}/{assetId}.{ext}`，物理路径 `data/assets/` + storageKey。允许删除旧扁平文件与重建 DB。
- **Rationale**: 澄清 Q3=C；会话关联清晰，删除会话时可按目录清理（后续可选）。
- **Alternatives**: 仅 DB 记 kind、磁盘仍扁平 — 不符合用户「子目录」要求。

## 5. 会话 kind 与资产 type

- **Decision**: `conversations.kind` 默认 `image`；`assets.asset_type` 默认 `image`。图标会话生成写入 `icon`。列表 API `GET /api/assets?type=image|icon`。
- **Rationale**: 过滤与存储分支需要显式类型，不能只靠目录推断。
- **Alternatives**: 仅用目录推断 — 脆弱，API 过滤不便。

## 6. Agent schema 扩展

- **Decision**: 在既有 `AgentReply` 上扩展可选 `suggestedSizes: number[]`；`icon` 会话系统提示强调尺寸与透明底；`readyToGenerate` 仍为门闩。
- **Rationale**: 最小增量，复用 `/api/chat` + `/api/generate`。
- **Alternatives**: 独立 `/api/icon-chat` — 重复成本高。

## 7. MCP `generate_icon`

- **Decision**: 与 `generate_image` 并列；内部调共享 `mcpGenerateIcon({ prompt, sizes?, model? })`，创建 `source=mcp` 且 `kind=icon` 会话（或等价元数据），批量 persist 到 `icons/`。
- **Rationale**: 澄清 Q4=B；无认证、本机受信，与 003 一致。
- **Alternatives**: 仅 Web — 已否决。

## 8. 生成方式（提示词内嵌尺寸）

- **Decision**: 对每个 size，在最终提示词追加 `... icon, {size}x{size} pixels, flat, transparent background`；若 Provider 未来支持 `size` 参数再下沉。
- **Rationale**: 当前 Poe 封装以 prompt 为主；与现有 `runGeneration` 兼容成本最低。
