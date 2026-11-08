# Research: 文生图 MVP

## 1. 全栈框架

**Decision**: Next.js 15 App Router + TypeScript 全栈单体（UI + Route Handlers）

**Rationale**: 单用户自用场景无需独立 API 服务；同仓类型共享；本地 `next dev` 一条命令即可验证。符合 Constitution「MVP 克制」。

**Alternatives considered**:
- Next + FastAPI：Python OpenAI SDK 熟悉，但双运行时增加摩擦，MVP 不值得。
- SvelteKit：可行，但用户明确偏向 Next.js。

## 2. Poe 对接方式

**Decision**: 使用官方 `openai` npm 包，`baseURL = process.env.POE_BASE_URL ?? "https://api.poe.com/v1"`，`apiKey = process.env.POE_API_KEY`；图像生成调用 `chat.completions.create` 且 `stream: false`。

**Rationale**: Poe 文档明确提供 OpenAI 兼容 Chat Completions；媒体 bot 推荐非流式。

**Alternatives considered**:
- Poe 原生 Python 库：与 Next 全栈不一致。
- 自建 HTTP 客户端：重复造轮子，无必要。

**解析策略**: 响应中的图像可能以 markdown 图片、content parts 的 `image_url`、或厂商扩展附件出现。实现 `extractImageUrls(completion)` 适配器，对每个 URL/data-URL 下载或解码后写入 `StorageBackend`。无图则返回可读错误，不创建空资产。

## 3. 默认模型与白名单

**Decision**: 默认 `GPT-Image-1.5`；白名单初始含 `GPT-Image-1.5`、`FLUX-pro-1.1`、`Imagen-4`；允许用户输入自定义模型 ID。

**Rationale**: 澄清结论 + Poe 图像 bot 实践文档主推；白名单避免依赖 `/v1/models` 全量拉取。

**Alternatives considered**: 远程全量目录（已在 clarify 中否决）。

## 4. 上下文窗口 N

**Decision**: 默认 `N = 6`（最近 6 条 message，含 user/assistant）；可通过环境变量 `SURREAL_CONTEXT_MESSAGE_LIMIT` 调整（建议范围 2–20）。组装时额外前置一条 `system`（来自全局 GenerationProfile）。对历史助手消息中的图片，优先附带本地可访问 URL 或重新以 `image_url` 形式引用已落盘文件（若 Poe 接受公网 URL；本机文件则转 data-URL，注意体积上限——超限则仅保留文本提示词摘要）。

**Rationale**: 澄清要求「最近 N 轮有上限」；6 条约等于 3 轮往返，平衡改图连贯与点数/延迟。

**Alternatives considered**: 无历史（改图弱）；全文历史（贵且不稳）。

## 5. 元数据与文件存储

**Decision**: SQLite 存会话/消息/资产/配置；文件存 `SURREAL_DATA_DIR/assets/{assetId}.{ext}`；使用 Node.js 22+ 内置 `node:sqlite`（`DatabaseSync`），薄仓储层而非 Drizzle/`better-sqlite3`。

**Rationale**: 单机零运维；避免 pnpm 忽略原生编译脚本导致 `better-sqlite3` 不可用；API 足够支撑 MVP CRUD。

**Alternatives considered**: Drizzle + better-sqlite3——原生绑定在当前环境难构建；纯 JSON 文件——查询弱；PostgreSQL——过重。

## 6. 缩略图

**Decision**: MVP 用 CSS/`next/image` 约束展示尺寸；可选后台用 `sharp` 生成 `thumb_` 文件（非阻塞 P1）。首版可不强制独立缩略文件。

**Rationale**: 千级以内本地图原图缩放足够；减少生成路径复杂度。

## 7. 并发生成

**Decision**: 同一浏览器会话默认串行（发送中禁用重复提交）；服务端按请求并行合法但依赖 Poe 限额；资产 ID 使用 ULID/UUIDv7 避免冲突。

**Rationale**: 自用足够；避免重复扣点。

## 8. 安全边界

**Decision**: 默认文档要求绑定 `127.0.0.1`；不实现登录；`POE_API_KEY` 仅服务端读取，绝不下发到客户端 bundle。

**Rationale**: Constitution 单用户 + 密钥隔离。

## 9. 许可证与依赖

**Decision**: 优先 MIT/Apache 依赖；避免引入强 copyleft 与 AGPL 冲突不清的闭源 SDK。`openai` 官方 SDK 可接受。

**Rationale**: 项目 AGPL-3.0，依赖许可证需可审计。
