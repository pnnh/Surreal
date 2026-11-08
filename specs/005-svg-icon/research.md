# Research: 005-svg-icon

## 1. 生成管线：文本模型写 SVG vs 位图再矢量化

- **Decision**: 使用 Poe 文本模型（与 Agent 同族，默认 `GPT-4o-Mini` / `SURREAL_AGENT_MODEL`）直接输出 SVG 源码。
- **Rationale**: 规格要求真矢量与 `currentColor`；ImageProvider 只能出栅格。
- **Alternatives**: 位图 + 矢量化服务 — 质量差且难保 CSS 着色；专用矢量 API — 超出 MVP。

## 2. CSS 大小与颜色约定

- **Decision**: 强制根元素含 `viewBox`；填充/描边主色使用 `currentColor`；根上可省略固定 px `width`/`height`，或设为 `100%`；预览容器用 CSS `width` + `color` 控制。
- **Rationale**: 用户明确要求 CSS 可调；行业单色图标惯例。
- **Alternatives**: CSS 变量 `--icon-color` — 亦可，但 `currentColor` 更通用；多色固定 palette — 仅当用户坚持，并在 assumptions 标明换色受限。

## 3. 校验与安全

- **Decision**: 剥离 markdown 围栏 → 定位 `<svg…</svg>` → 拒绝 `<script`、`onload=`、`javascript:`、`xlink:href` 外链、`<foreignObject>`（MVP 可整段拒绝）→ 要求存在 `viewBox` → 建议检测 `currentColor`（缺失时自动改写常见 `fill="#…"` 为 `currentColor` 或返回可恢复错误让模型重试一次）。
- **Rationale**: 轻量静态检查满足规格 FR-006，避免引入完整 SVG 优化器依赖。
- **Alternatives**: DOMPurify/svg-sanitize 包 — 可后置；MVP 手写规则足够。

## 4. 会话 kind 与资产 type

- **Decision**: `ConversationKind` / `AssetType` 增加 `'svg'`；UI 三选一；过滤四态：全部 / image / icon / svg。
- **Rationale**: 与位图 icon 批量逻辑彻底分流。
- **Alternatives**: icon + format 字段 — 更绕，易与 sizes 批量纠缠。

## 5. 存储路径

- **Decision**: `{conversationId}/svg/{assetId}.svg`，mime `image/svg+xml`。
- **Rationale**: 规格建议路径；与 images/icons 并列。
- **Alternatives**: 放在 icons/ 下用扩展名区分 — 过滤与清理不如独立目录清晰。

## 6. Agent schema

- **Decision**: 复用既有 `AgentReply`（`suggestedPrompt` 作为英文图标规格描述）；`svg` 会话忽略 `suggestedSizes`；系统提示强调单色 CSS 图标、确认前不输出 SVG 源码给用户当最终文件。
- **Rationale**: 最小增量。
- **Alternatives**: 独立 schema 字段 `svgBrief` — 不必要。

## 7. 门闩生成入口

- **Decision**: `POST /api/generate` 在 `conversation.kind==='svg'` 时走 `runSvgGeneration`（文本补全 → sanitize → persist 文本文件）；`source=confirm|skip` 语义不变。
- **Rationale**: UI 可复用「立即生成」。
- **Alternatives**: 新 `/api/generate-svg` — 重复样板。

## 8. MCP

- **Decision**: `generate_svg_icon({ prompt, model? })` → 创建 `source=mcp, kind=svg` → 直出。
- **Rationale**: 对齐 003/004。
- **Alternatives**: 复用 generate_icon 加 format — 契约更糊。

## 9. 预览 UX

- **Decision**: 聊天内联 `SvgPreview`：dangerously 渲染经 sanitize 的 SVG（或 `<img src=fileUrl>`）；提供简单 color / size 滑块或预设，证明 SC-006。资产库用 `<img>` 或内联缩略图。
- **Rationale**: `<img src=.svg>` 无法用 CSS `color` 改 `currentColor`；内联才能演示换色。sanitize 后内联可接受。
- **Alternatives**: 仅源码查看器 — 弱于验收标准。
