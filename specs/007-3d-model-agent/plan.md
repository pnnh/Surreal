# Implementation Plan: 3D 静态模型生成专有 Agent 与可插拔 Provider 架构

**Branch**: `007-3d-model-agent` | **Date**: 2026-11-11 | **Spec**: [spec.md](file:///Users/Larry/Projects/github/Surreal/specs/007-3d-model-agent/spec.md)

**Input**: Feature specification from `/specs/007-3d-model-agent/spec.md`

---

## Summary

为 Surreal 游戏美术工作台引入第四位领域专家 —— **3D 模型专家 Agent (`ThreeDSpecialist`)**，支持角色、道具、植被与硬表面四大类别先验（Category Presets）与领域级反向拷问（3D Grill）；构建可插拔的 **`ThreeDProvider` 引擎架构**（默认内置合规的 Mock 3D 模型生成，支持自建 GPU 实例标准 HTTP 接入与云端 Serverless 扩展）；在数据层和存储层规范保存 `.glb` 资产至 `data/assets/<convId>/models/<id>.glb`；在前端引入 `<model-viewer>` 实现高保真 360° 交互式 3D 预览、视角控制与下载；并在 MCP 服务中暴露 `generate_3d_model` 工具。

---

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20+ (ESM, `node:sqlite`)  
**Primary Dependencies**: Next.js 15.5 (App Router, Turbopack), React 19, Tailwind CSS v4, `@modelcontextprotocol/sdk`, `@google/model-viewer` (Web Component)  
**Storage**: 本地 SQLite (`surreal.sqlite`) + 本地文件系统 (`data/assets/<convId>/models/*.glb`)  
**Testing**: Vitest (`pnpm test`), ESLint (`pnpm lint`), Next build (`pnpm build`)  
**Target Platform**: Web (macOS / Linux / Windows 现代浏览器，支持 WebGL)  
**Project Type**: Next.js Web 应用 + MCP Stdio/HTTP Server  
**Performance Goals**: 
- `Mock3DProvider` 生成耗时 < 50ms
- 前端 3D 视口初始化加载 < 500ms，60fps 流畅交互旋转
- Next.js 构建产物无冗余打包臃肿
**Constraints**: 
- 离线环境无 GPU 时 100% 可用（Mock 默认驱动）
- 遵循 glTF 2.0 Binary 规范，校验 `glTF` 4 字节魔数
- 严禁将 API Key 等机密写入代码库，全部读取环境变量
**Scale/Scope**: 单用户自用工作台，支持单会话管理多类型资产

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **无硬编码机密**：API URL 与密钥仅读取环境变量（`THREE_D_API_URL`、`THREE_D_API_KEY`、`FAL_KEY`）。
- [x] **离线与测试自洽**：默认使用 `Mock3DProvider`，自动化测试和断网环境不需要任何外部 GPU。
- [x] **架构解耦**：3D 生成引擎与 UI/Agent 之间通过 `ThreeDProvider` 接口完全解耦。
- [x] **向下兼容**：保留既有 `image`、`icon`、`svg` 会话与 MCP 工具，无破坏性变更。
- [x] **语言要求**：中文回复与项目文档，代码标识符使用英文。

---

## Project Structure

### Documentation (this feature)

```text
specs/007-3d-model-agent/
├── spec.md              # 需求规范
├── plan.md              # 架构实施规划 (当前文件)
├── research.md          # Phase 0 技术调研
├── data-model.md        # Phase 1 数据模型设计
├── quickstart.md        # Phase 1 快速上手指引
├── contracts/           # Phase 1 接口契约
│   ├── 3d-provider-api.yaml
│   └── subagent-3d-protocol.md
└── tasks.md             # Phase 2 任务清单 (/speckit-tasks 输出)
```

### Source Code Layout

```text
lib/
├── db/
│   ├── types.ts                   # 扩展 AssetType="model", ConversationKind="model", SubagentType="model"|"3d"
│   ├── client.ts                  # assets 表已有兼容性确认
│   └── assets.ts                  # 扩展 3D 资产读取与落盘逻辑
├── providers/
│   └── 3d/                        # [新增] 3D Provider 体系
│       ├── types.ts               # ThreeDProvider 接口与配置
│       ├── mock-provider.ts       # Mock3DProvider (合规 .glb 二进制生成)
│       ├── http-provider.ts       # CustomHttp3DProvider (标准 POST /generate 适配)
│       └── index.ts               # Provider 工厂函数 (get3DProvider)
├── agents/
│   ├── subagents/
│   │   ├── 3d-specialist.ts       # [新增] ThreeDSpecialist (类别先验与 3D Grill)
│   │   └── base.ts
│   └── coordinator/
│       ├── intent-prompt.ts       # 意图识别支持 3D / model
│       └── run-coordinator-turn.ts# 路由分发支持 3D
├── generation/
│   └── run.ts                     # 扩展 assetType: "model" 处理流水线
components/
├── chat/
│   ├── ModelViewer.tsx            # [新增] Google <model-viewer> 3D 交互预览组件
│   ├── AgentReplyCard.tsx         # 支持 3D 资产卡片与专家徽标
│   └── ChatWorkspace.tsx          # 适配 3D 会话类型与模型资产展示
└── assets/
    └── AssetCard.tsx              # 支持 3D 缩略与弹窗预览
mcp/
└── server.ts                      # 注册 generate_3d_model MCP 工具
tests/
├── unit/
│   ├── 3d-provider.test.ts        # [新增] 3D Provider 单元测试 (Mock 与魔数校验)
│   ├── 3d-specialist.test.ts      # [新增] ThreeDSpecialist Grill 单元测试
│   └── coordinator-lifecycle.test.ts # 扩充 3D 意图全生命周期测试
```
