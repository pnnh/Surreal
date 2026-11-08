# 技术栈（已实现）

正式计划见：[`specs/001-text-to-image-mvp/plan.md`](../../specs/001-text-to-image-mvp/plan.md)

| 项 | 选择 |
| --- | --- |
| 框架 | Next.js 15 全栈（App Router） |
| 语言 | TypeScript |
| Poe | `openai` SDK → `https://api.poe.com/v1` |
| 默认模型 | `GPT-Image-1.5`（白名单另含 FLUX-pro-1.1、Imagen-4） |
| 元数据 | Node.js `node:sqlite` |
| 文件 | 本地 `SURREAL_DATA_DIR` + `StorageBackend` |
| 上下文 | 最近 N=6 条消息 + 全局 system prompt |

启动：`pnpm dev` → http://127.0.0.1:3000
