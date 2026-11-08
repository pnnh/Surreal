# Implementation Plan: 轻量生图 Agent（反向拷问澄清）

**Branch**: `002-image-agent-grill` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-image-agent-grill/spec.md`

## Summary

将对话主路径改为「文本 Agent（默认 `GPT-4o-Mini`）先反向拷问澄清 → 用户确认或跳过澄清 → 再调用既有生图管线」。移除输入区 ✨ 旁路优化。Agent 每轮输出可解析结构（澄清点、建议提示词、`readyToGenerate`）；UI 在 ready 时提供「立即生成」，并始终提供「跳过澄清」。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x（既有）

**Primary Dependencies**: Next.js 15、`openai` SDK（Poe）、既有 SQLite/`node:sqlite`、zod（结构化输出校验）

**Storage**: 复用 Conversation/Message/Asset；Message 可扩展元数据字段存 Agent 结构化结果

**Testing**: Vitest（解析/门闩逻辑）；手工 quickstart 验收

**Target Platform**: 本机 Next.js（`127.0.0.1`）

**Project Type**: 既有 Web 全栈增量改造

**Performance Goals**: Agent 轮次秒级～十余秒；生图仍受 Poe 图像 bot 耗时约束；确认前零生图调用

**Constraints**: 密钥仅环境变量；确认前禁止生图；每轮 2–4 问；默认 Agent=`GPT-4o-Mini`

**Scale/Scope**: 单用户；改造对话 API + Chat UI；不改资产库/S3

## Constitution Check

| 原则 | 状态 | 说明 |
| --- | --- | --- |
| I. MVP 克制 | PASS | 仅对话路径 Agent 化；无 3D/多租户 |
| II. 密钥隔离 | PASS | 仍只用 `POE_API_KEY` 等环境变量 |
| III. Provider 可替换 | PASS | 文本 Agent 与 ImageProvider 分离 |
| IV. 存储可演进 | PASS | 复用既有存储抽象 |
| V. AGPL / 可审计 | PASS | 规格与任务可追溯 |

**Post-design re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-image-agent-grill/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── agent-api.yaml
└── tasks.md
```

### Source Code (impacted)

```text
lib/env.ts                          # SURREAL_AGENT_MODEL
lib/agents/
  types.ts                          # AgentReply schema
  grill-system-prompt.ts            # grill 行为系统提示
  run-agent-turn.ts                 # 调文本模型 + 解析
  detect-skip.ts                    # 自然语言跳过意图
lib/generation/run.ts               # 供确认/跳过后调用（可抽 finalPrompt）
app/api/chat/route.ts               # 新：用户消息 → Agent（替换直接 generate 主路径）
app/api/generate/route.ts           # 保留：显式门闩触发生图（confirm / skip）
components/chat/ChatWorkspace.tsx   # Agent UI、立即生成、跳过澄清；移除✨
lib/i18n/messages.ts                # 新文案
```

**Structure Decision**: 在既有 Next 单体上增量；对话发送改为 `/api/chat`，生图仅由门闩调用 `/api/generate`。

## Complexity Tracking

> 无 Constitution 违规。
