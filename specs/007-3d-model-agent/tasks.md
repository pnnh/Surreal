# Tasks: 3D 静态模型生成专有 Agent 与可插拔 Provider 架构

**Input**: Design documents from `/specs/007-3d-model-agent/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 包含 3D Provider 单元测试、ThreeDSpecialist 独立单测、Coordinator 3D 意图路由单测与 MCP 验证。

**Organization**: 按用户故事与系统分层组织，遵循 MVP 优先原则。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无强依赖）
- **[Story]**: US1–US6 对应 spec 用户故事
- 描述必须包含具体文件路径

---

## Phase 1: Setup & Data Model Foundations

**Purpose**: 准备活动功能配置、数据模型扩展与多语言字典

- [x] T001 更新活动功能指针为 `specs/007-3d-model-agent`（`.specify/feature.json` 与 `AGENTS.md`）
- [x] T002 扩展 `lib/db/types.ts`：将 `AssetType`、`ConversationKind` 与 `SubagentType` 扩充支持 `"model"` 与 `"3d"`
- [x] T003 [P] 扩展 `lib/i18n/messages.ts`：增加 3D 模型专家标签、3D 资产提示、面数风格与类别预设相关的中英双语文案
- [x] T004 [P] 声明 `<model-viewer>` TypeScript 全局 JSX 元素定义于 `types/model-viewer.d.ts`

---

## Phase 2: 3D Provider Architecture (Foundational Engine)

**Purpose**: 建立合规、解耦的 3D 生成引擎适配器（Mock 与 HTTP 模式）

- [x] T005 [P] 定义 3D Provider 接口及入参返回类型于 `lib/providers/3d/types.ts`
- [x] T006 [P] 实现 `Mock3DProvider` 于 `lib/providers/3d/mock-provider.ts`（生成合规的 glTF 2.0 Binary `.glb` 数据）
- [x] T007 [P] 实现 `CustomHttp3DProvider` 于 `lib/providers/3d/http-provider.ts`（支持超时与魔数校验）
- [x] T008 实现 Provider 工厂 `get3DProvider` 于 `lib/providers/3d/index.ts`
- [x] T009 [P] 编写 3D Provider 单元测试于 `tests/unit/3d-provider.test.ts`（验证 Mock 生成与 `glTF` 4 字节魔数有效性）

**Checkpoint**: 可以在不依赖任何外部 GPU 的情况下，生成并通过校验标准的 `.glb` 文件流。

---

## Phase 3: User Story 1 & 2 - 3D 领域级 Agent 与意图协同 (Priority: P1) 🎯 MVP

**Goal**: Coordinator 识别 3D 建模诉求并委派给 3D 专家；3D 专家根据类别预设执行 Grill 反向拷问

**Independent Test**: 在通用会话中输入“做一个低多边形木桶 3D 模型” → 3D 专家提出面数/对齐反问 → 用户确认后就绪

### Implementation for User Story 1 & 2

- [x] T010 [US1] 增强 Coordinator 意图识别 Prompt 于 `lib/agents/coordinator/intent-prompt.ts`，支持 `model` 意图提取
- [x] T011 [US2] 实现 `ThreeDSpecialist` 专业子 Agent 于 `lib/agents/subagents/3d-specialist.ts`（集成 Character/Prop/HardSurface/Foliage 类别预设与 Grill）
- [x] T012 [US1] 在 `lib/agents/coordinator/run-coordinator-turn.ts` 中注册并分发 `model` 任务至 `ThreeDSpecialist`
- [x] T013 [P] [US1] 编写 3D 专家与意图识别单测于 `tests/unit/3d-specialist.test.ts`

**Checkpoint**: 统一聊天中能准确捕捉 3D 需求，3D 专家注入几何先验并完成参数结构化。

---

## Phase 4: User Story 3 - 3D 模型生成流水线与本地落盘 (Priority: P1) 🎯 MVP

**Goal**: 3D 子任务达到就绪状态时，调用 3D Provider 生成 `.glb` 并原子落盘至 `data/assets/<convId>/models/<id>.glb`

**Independent Test**: 触发 3D 生成 → 磁盘生成有效 `.glb` 文件 → SQLite `assets` 表新增 `asset_type='model'` 记录

### Implementation for User Story 3

- [x] T014 [US3] 扩展 `lib/generation/run.ts`：支持 `assetType: "model"` 分支，对接 `get3DProvider().generate()`
- [x] T015 [US3] 更新 `lib/db/assets.ts`：支持 `models/` 目录规范创建与 `.glb` 资产记录创建
- [x] T016 [US3] 确保 `app/api/assets/[assetId]/route.ts` 支持 `.glb` 文件的流式响应与 `model/gltf-binary` MIME 标头
- [x] T017 [P] [US3] 扩展 `tests/unit/coordinator-lifecycle.test.ts`，验证 3D 任务就绪后生成并落盘的全生命周期

**Checkpoint**: 从聊天答复到 `.glb` 文件生成落盘的后端全链路打通。

---

## Phase 5: User Story 4 & 5 - 前端实时 3D 交互预览与资产库 (Priority: P1 & P2)

**Goal**: 聊天卡片与资产库提供 `<model-viewer>` 360° 交互视口、旋转/缩放/重置、下载与筛选

**Independent Test**: 生成完成后，消息内直接渲染 3D 视口，鼠标拖拽可旋转视角，点击“下载 .glb”成功获取模型文件

### Implementation for User Story 4 & 5

- [x] T018 [US4] 实现 `<model-viewer>` 客户端封装组件于 `components/chat/ModelViewer.tsx`（包含加载骨架、轨道控制、自动旋转与下载）
- [x] T019 [US4] 更新 `components/chat/AgentReplyCard.tsx`：当产物为 `model` 资产时渲染 `ModelViewer` 交互视口
- [x] T020 [US4] 更新 `components/chat/ChatWorkspace.tsx`：支持 3D 资产的消息渲染与新建会话列表
- [x] T021 [US5] 更新 `components/assets/AssetDrawer.tsx` / `AssetLibrary.tsx`：支持按“3D 模型”分类筛选，并在详情弹窗中交互预览

**Checkpoint**: 可以在浏览器中直接通过鼠标操作自由旋转 3D 模型，并一键下载导入外部 3D 软件。

---

## Phase 6: User Story 6 - MCP 扩展 `generate_3d_model` (Priority: P2)

**Goal**: Surreal MCP 服务器暴露 3D 静态模型生成工具

**Independent Test**: 外部 Agent 调用 `generate_3d_model`，返回 `.glb` 绝对路径与资产 ID

### Implementation for User Story 6

- [x] T022 [US6] 在 `mcp/server.ts` 中注册 `generate_3d_model` 工具（支持 `prompt`, `category`, `style`, `seed` 参数）
- [x] T023 [P] [US6] 编写 MCP 验证脚本于 `scripts/verify-mcp-3d.ts` 并在 `package.json` 中添加 `pnpm mcp:verify-3d`

**Checkpoint**: MCP 客户端能通过标准协议一键直出 3D 模型。

---

## Phase 7: Polish, Verification & Documentation

**Purpose**: 代码质量、全套测试套件运行与文档更新

- [x] T024 运行 `pnpm test` 确保所有新增与原有测试（100% 通过）
- [x] T025 运行 `pnpm lint` 保证 0 报错 0 警告
- [x] T026 运行 `pnpm build` 确认 Next.js 生产环境构建成功
- [x] T027 更新 `README.md` 与 `AGENTS.md` 记录 3D 静态模型 Agent 与 Provider 架构
