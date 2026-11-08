# Implementation Plan: 文生图 MVP（对话 + 本地资产收藏）

**Branch**: `001-text-to-image-mvp` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-text-to-image-mvp/spec.md`

## Summary

构建 Next.js 全栈自用工作台：对话式调用 Poe OpenAI 兼容 API（默认模型 `GPT-Image-1.5`）完成文生图；将返回图像立即落盘到本地存储；提供资产库（浏览/收藏/删除）与全局系统提示词设置。密钥仅环境变量；存储与 Provider 可替换抽象为后续 S3/其它模型预留。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x（LTS）

**Primary Dependencies**: Next.js 15（App Router）、React 19、`openai`（Poe base URL）、Node.js `node:sqlite`、zod、ulid、（可选）sharp 生成缩略图

**Storage**: SQLite via `node:sqlite`（元数据）+ 本地文件系统（`SURREAL_DATA_DIR`，默认 `./data`）；`StorageBackend` 接口预留 S3

**Testing**: Vitest（单元/契约）、Playwright 可选做 E2E 冒烟；Poe 调用用 mock/fixture

**Target Platform**: 本机开发与私有部署（macOS/Linux）；默认绑定 `localhost`

**Project Type**: Web application（Next.js 全栈单体）

**Performance Goals**: 单用户交互；生成等待以 Poe 为准（通常数十秒级）；资产库千级图片流畅浏览

**Constraints**: 密钥不进仓/不写配置文件；图像 bot 使用 `stream: false`；上下文窗口默认 N=6 条消息；无多用户认证；MVP 不做图生图上传

**Scale/Scope**: 单用户；页面：对话、资产库、设置；API：会话/消息/生成/资产/配置/模型白名单

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
| --- | --- | --- |
| I. 自用优先，MVP 克制 | PASS | 仅文生图对话+资产+全局提示词；无 3D/多租户 |
| II. 密钥与配置隔离 | PASS | `POE_API_KEY` 等仅环境变量；`.env.example` 无密钥 |
| III. Provider 可替换 | PASS | `ImageProvider` 接口，MVP 仅 `PoeProvider` |
| IV. 存储可演进 | PASS | `StorageBackend` + LocalFs；S3 形状预留 |
| V. AGPL 与可审计 | PASS | LICENSE AGPL-3.0；规格/计划可追溯 |

**Post-design re-check**: PASS（契约与数据模型未引入多租户/密钥文件加载/过早 S3 实现）

## Project Structure

### Documentation (this feature)

```text
specs/001-text-to-image-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   └── models-allowlist.json
└── tasks.md              # /speckit-tasks 生成（本阶段不创建）
```

### Source Code (repository root)

```text
app/                          # Next.js App Router
├── (app)/
│   ├── page.tsx              # 对话主界面
│   ├── assets/page.tsx       # 资产库
│   └── settings/page.tsx     # 全局系统提示词 / 默认模型
├── api/
│   ├── health/route.ts
│   ├── conversations/
│   ├── generate/route.ts
│   ├── assets/
│   ├── profile/route.ts
│   └── models/route.ts
├── layout.tsx
└── globals.css

components/                   # 对话气泡、资产网格、设置表单等
lib/
├── env.ts                    # 环境变量读取与校验（无密钥落盘）
├── db/                       # SQLite schema + 访问
├── providers/
│   ├── types.ts              # ImageProvider 接口
│   └── poe.ts                # Poe OpenAI 兼容实现
├── storage/
│   ├── types.ts              # StorageBackend
│   └── local-fs.ts
├── generation/
│   ├── context-window.ts     # 最近 N 轮组装
│   └── persist.ts            # 下载图片并写资产
└── models/allowlist.ts

data/                         # 运行时（Git 忽略）
├── surreal.sqlite
└── assets/...

tests/
├── unit/
└── contract/
```

**Structure Decision**: 采用 Next.js 全栈单体（App Router + Route Handlers），避免前后端拆仓；与「自用 MVP」一致，部署与调试成本最低。

## Complexity Tracking

> 无 Constitution 违规需豁免。
