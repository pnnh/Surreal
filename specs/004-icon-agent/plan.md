# Implementation Plan: 生图标 Agent

**Branch**: `004-icon-agent` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-icon-agent/spec.md`

## Summary

在既有「文本 Agent 反向拷问 → 门闩确认 → 生图落盘」之上，新增平行的**图标会话类型**：新建会话可选 `image|icon`；图标 Agent 额外敲定尺寸列表并批量生成位图（PNG/WebP，透明底优先，不做 SVG）；资产元数据增加 `assetType`，资产库按类型过滤；本地落盘改为 `data/assets/<conversationId>/{images|icons}/<id>.ext`（允许清空旧扁平数据）；MCP 新增 `generate_icon` 直出（无反问）。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x（既有）

**Primary Dependencies**: Next.js 15、`openai`（Poe）、`@modelcontextprotocol/sdk`、`node:sqlite`、zod、tsx

**Storage**: SQLite 元数据 + 本地 FS；路径改为按会话分子目录；允许重置 `data/`

**Testing**: Vitest（路径/类型/Agent schema/尺寸校验）；`pnpm mcp:verify` 风格脚本；手工 quickstart

**Target Platform**: 本机 Next.js `127.0.0.1` + Cursor MCP stdio

**Project Type**: 既有 Web 全栈 + MCP 增量

**Performance Goals**: 澄清秒级～十余秒；批量 N 尺寸受 Poe 耗时 × N 约束；单批尺寸上限建议 12

**Constraints**: 密钥仅环境变量；确认前禁生图；位图 only；透明尽力而为；可清空旧 data

**Scale/Scope**: 单用户；改造会话 kind、Agent、persist、资产列表、MCP；不做 SVG/多用户/S3

## Constitution Check

| 原则 | 状态 | 说明 |
| --- | --- | --- |
| I. MVP 克制 | PASS | 位图图标 + 对话 Agent + MCP；明确排除 SVG/3D |
| II. 密钥隔离 | PASS | 仍只用环境变量 / `.env`（gitignore） |
| III. Provider 可替换 | PASS | 仍经 ImageProvider；图标为业务层批量编排 |
| IV. 存储可演进 | PASS | storageKey 相对路径；LocalFs 抽象不变 |
| V. AGPL / 可审计 | PASS | 规格与任务可追溯 |

**Post-design re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-icon-agent/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── icon-agent-api.yaml
│   └── mcp-tools.md
└── tasks.md                 # /speckit-tasks
```

### Source Code (impacted)

```text
lib/db/types.ts                 # ConversationKind, AssetType
lib/db/client.ts                # kind / asset_type 列迁移
lib/db/conversations.ts         # create/list with kind
lib/db/assets.ts                # assetType filter
lib/storage/local-fs.ts         # 不变；由 storageKey 承载子路径
lib/generation/persist.ts       # storageKey = {convId}/{images|icons}/{id}.ext
lib/generation/run.ts           # 支持 sizes[] 批量 + assetType
lib/agents/types.ts             # suggestedSizes / icon schema 扩展
lib/agents/grill-system-prompt.ts  # 或拆 icon-grill-system-prompt.ts
lib/agents/run-agent-turn.ts    # 按 kind 选 prompt/schema
lib/mcp/generate.ts             # mcpGenerateIcon
mcp/server.ts                   # register generate_icon
app/api/conversations/route.ts  # POST kind
app/api/chat/route.ts           # kind-aware agent
app/api/generate/route.ts       # sizes + assetType
app/api/assets/route.ts         # ?type=image|icon
components/chat/ChatWorkspace.tsx
components/chat/NewConversation*  # 选 image/icon
components/assets/*             # 类型过滤
lib/i18n/messages.ts
```

**Structure Decision**: 在既有 Next 单体 + `mcp/server.ts` 上增量；不新建独立服务。

## Complexity Tracking

> 无 Constitution 违规。批量尺寸为产品必需；相对「只出一张再本地缩放」更贴合图标清晰度需求（澄清 Q2=B）。
