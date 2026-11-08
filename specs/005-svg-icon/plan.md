# Implementation Plan: SVG 矢量图标 Agent

**Branch**: `005-svg-icon` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-svg-icon/spec.md`

## Summary

在既有图片 / 位图图标会话之上新增 **`svg` 会话类型**：文本 Agent（grill）澄清后，由**文本模型**一次性产出单份 SVG 源码；系统提示与校验强制 `viewBox` + `currentColor`（CSS 可调大小/颜色）；落盘 `data/assets/<convId>/svg/`；资产类型 `svg` 进入资产库过滤；MCP 新增 `generate_svg_icon` 直出。不走 ImageProvider 栅格管线，不按多像素档批量出多份 SVG。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x（既有）

**Primary Dependencies**: Next.js 15、`openai`（Poe 文本）、zod、既有 SQLite / MCP SDK；SVG 解析用轻量校验（正则 + DOMParser 或 `node` 侧简单解析，避免重型依赖）

**Storage**: SQLite 元数据 + 本地 FS；`storageKey = {conversationId}/svg/{assetId}.svg`

**Testing**: Vitest（剥离围栏、校验、安全拒绝、路径）；`pnpm mcp:verify-svg`；手工 quickstart

**Target Platform**: 本机 Next.js + Cursor MCP stdio

**Project Type**: 既有 Web 全栈 + MCP 增量

**Performance Goals**: Agent 秒级～十余秒；单次 SVG 生成通常快于位图批量

**Constraints**: 密钥仅环境变量；确认前不落盘；禁止 script/外链资源；默认单色 `currentColor`

**Scale/Scope**: 单用户；扩展 kind/assetType；新增 SVG 生成路径与预览控件

## Constitution Check

| 原则 | 状态 | 说明 |
| --- | --- | --- |
| I. MVP 克制 | PASS | 仅 SVG 矢量切片；无 3D/多租户 |
| II. 密钥隔离 | PASS | 仍用 `POE_API_KEY` 等环境变量 |
| III. Provider 可替换 | PASS | 文本补全经 OpenAI 兼容客户端；可换模型 ID |
| IV. 存储可演进 | PASS | storageKey 相对路径；LocalFs 不变 |
| V. AGPL / 可审计 | PASS | 规格与任务可追溯 |

**Post-design re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-svg-icon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── svg-agent-api.yaml
│   └── mcp-tools.md
└── tasks.md
```

### Source Code (impacted)

```text
lib/db/types.ts                      # kind/assetType += svg
lib/db/conversations.ts / assets.ts  # 读写 svg
lib/storage/asset-path.ts            # svg/ 分支
lib/svg/sanitize.ts                  # 剥离围栏、安全与结构校验
lib/svg/generate.ts                  # 调文本模型产出 SVG
lib/agents/svg-grill-system-prompt.ts
lib/agents/run-agent-turn.ts         # kind=svg
lib/generation/run.ts                # 或 runSvgGeneration 分流
lib/mcp/generate.ts                  # mcpGenerateSvgIcon
mcp/server.ts                        # generate_svg_icon
app/api/conversations|chat|generate|assets
components/chat/ChatWorkspace.tsx    # 三选一 kind
components/chat/SvgPreview.tsx       # CSS color/size 演示
components/assets/AssetLibrary.tsx   # 类型过滤 svg
lib/i18n/messages.ts
```

**Structure Decision**: 在既有单体上增量；SVG 生成与位图 `runGeneration` 分支分离。

## Complexity Tracking

> 无 Constitution 违规。独立 `sanitize` 模块为安全边界所必需。
