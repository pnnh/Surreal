# Tasks: 统一主聊天 Agent 与子 Agent 任务协同架构

**Input**: Design documents from `/specs/006-unified-coordinator-agent/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 包含 Coordinator 意图识别单测、子 Agent 独立单测与生命周期流转单测。

**Organization**: 按用户故事（US1~US5）分阶段组织，遵循 MVP 优先原则。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无强依赖）
- **[Story]**: US1–US5 对应 spec 用户故事
- 描述必须包含具体文件路径

---

## Phase 1: Setup & Data Model Foundations

**Purpose**: 准备通用会话模型、子任务数据表与国际化文案

- [x] T001 确认活动功能指针为 `specs/006-unified-coordinator-agent`（`.specify/feature.json`、`AGENTS.md`）
- [x] T002 扩展 `lib/db/types.ts`：增加 `ConversationKind = "general"`，定义 `SubagentType`、`SubagentTaskStatus` 与 `SubagentTask` 实体
- [x] T003 扩展 SQLite 表结构在 `lib/db/client.ts`：新建 `subagent_tasks` 表并在 `conversations` 表增加 `active_task_id` 列
- [x] T004 [P] 实现 `lib/db/tasks.ts`：提供 `createTask`、`getTask`、`updateTask`、`getActiveTask` 等 CRUD 操作
- [x] T005 [P] 在 `lib/i18n/messages.ts` 增加通用会话、协同专家标签（图片/图标/SVG 专家）与任务状态中英双语文案

---

## Phase 2: Subagent Specialist Abstraction (Foundational)

**Purpose**: 将原先分散在 `run-agent-turn.ts` 中的三类 Grill 逻辑彻底模块化为专业子 Agent

- [x] T006 [P] 封装图片专业子 Agent 于 `lib/agents/subagents/image-specialist.ts`（支持 `SubagentInput` → `SubagentOutput`）
- [x] T007 [P] 封装位图图标专业子 Agent 于 `lib/agents/subagents/icon-specialist.ts`（包含尺寸推荐与透明背景分析）
- [x] T008 [P] 封装 SVG 矢量专业子 Agent 于 `lib/agents/subagents/svg-specialist.ts`（包含 viewBox 与 currentColor 约束）
- [x] T009 [P] 编写专业子 Agent 独立运行单测于 `tests/unit/subagents.test.ts`，验证输出契约

**Checkpoint**: 各子 Agent 可独立调用并返回标准化 `SubagentOutput`。

---

## Phase 3: User Story 1 - 统一会话入口与自适应意图识别 (Priority: P1) 🎯 MVP

**Goal**: 用户新建会话无需选类型；Coordinator 区分纯闲聊与资产诉求

**Independent Test**: 新建通用会话 → 闲聊直接输出；提出资产需求准确识别目标类型

### Implementation for User Story 1

- [x] T010 [US1] 编写主 Agent 意图识别系统提示词与 JSON 规范于 `lib/agents/coordinator/intent-prompt.ts`
- [x] T011 [US1] 实现 Coordinator 核心调度器于 `lib/agents/coordinator/run-coordinator-turn.ts`，处理闲聊与意图分析
- [x] T012 [US1] 更新 `app/api/conversations/route.ts` 与 `lib/db/conversations.ts`，新建会话默认采用 `kind="general"`
- [x] T013 [US1] 更新 `components/chat/ChatWorkspace.tsx`，移除新建会话时的强制类型选择控件，支持通用会话直达
- [x] T014 [P] [US1] 编写 Coordinator 意图识别单测于 `tests/unit/coordinator-intent.test.ts`

**Checkpoint**: 可以在通用会话中自由闲聊，不误触发任何反向拷问。

---

## Phase 4: User Story 2 - 子 Agent 拷问代理转发与人机交互闭环 (Priority: P1) 🎯 MVP

**Goal**: 识别资产诉求后派发给子 Agent；子 Agent 反问由主 Agent 友好代为提问

**Independent Test**: 输入“做一个药水图标” → 主 Agent 代为提出尺寸/背景反问 → UI 提示“图标专家”

### Implementation for User Story 2

- [x] T015 [US2] 在 `lib/agents/coordinator/run-coordinator-turn.ts` 中实现任务派发流：意图为 `delegate` 时创建 `SubagentTask`（`in_grill`）并绑定活跃任务
- [x] T016 [US2] 重构 `app/api/chat/route.ts`：支持 Coordinator 协同调度流，在响应中返回 `coordinator` 与 `task` 数据
- [x] T017 [US2] 更新 `components/chat/AgentReplyCard.tsx`，增加专业子 Agent 协同标识与反问引导卡片
- [x] T018 [US2] 在 `components/chat/AgentReplyCard.tsx` 增加“跳过澄清 / 立即生成”按钮并支持快捷指令透传

**Checkpoint**: 模糊资产诉求能稳定触发子 Agent 拷问并由主 Agent 结构化展示。

---

## Phase 5: User Story 3 - 答复精准路由与就绪生成落盘 (Priority: P1) 🎯 MVP

**Goal**: 用户答复细节直达活跃子 Agent；就绪后触发生成流水线落盘入库

**Independent Test**: 针对反问回复“16和32像素” → 子 Agent 确认就绪 → 调用生成流水线 → 界面展现图标

### Implementation for User Story 3

- [x] T019 [US3] 在 `lib/agents/coordinator/run-coordinator-turn.ts` 实现 Fast-Path 路由：活跃任务处于 `in_grill` 时直接转交子 Agent 处理
- [x] T020 [US3] 实现子任务就绪（`ready`）触发底层生成：对接 `lib/generation/run.ts` 与 `lib/svg/generate.ts`，资产写入对应目录
- [x] T021 [US3] 任务完成后更新 `SubagentTask` 状态为 `completed` 并释放 `active_task_id`，将产物卡片推入主会话
- [x] T022 [P] [US3] 编写生命周期状态机单测于 `tests/unit/coordinator-lifecycle.test.ts`

**Checkpoint**: 端到端完成“诉求 → 反问 → 答复 → 就绪生成 → 本地落盘”全闭环。

---

## Phase 6: User Story 4 - 跨资产上下文复用与多任务推进 (Priority: P2)

**Goal**: 同一会话内连续派发不同资产任务，继承前序画风与世界观上下文

**Independent Test**: 先生成大图，接着要求提取特征做 SVG 图标，风格保持协调

### Implementation for User Story 4

- [x] T023 [US4] 实现上下文提取器于 `lib/agents/coordinator/context-builder.ts`，提炼前序资产的画风与主题关键词
- [x] T024 [US4] 在任务派发时注入 `contextSummary`，使新子 Agent 能感知前序资产风格，资产库按类型过滤均能索引到对应文件

---

## Phase 7: User Story 5 - 向下兼容历史数据与 MCP 服务 (Priority: P2)

**Goal**: 历史 `001~005` 独立会话正常运行；MCP 直出服务不受任何影响

**Independent Test**: 打开老版本图标会话正常查看；`pnpm mcp:stdio` 验证全绿

### Implementation for User Story 5

- [x] T025 [US5] 在 `app/api/chat/route.ts` 中维护老版本会话兼容路径（当 `kind !== "general"` 时保留既有 `runAgentTurn`）
- [x] T026 [P] [US5] 验证 MCP 直出工具稳定运行并执行 `pnpm mcp:stdio`

---

## Phase 8: Polish & Documentation

- [x] T027 按 `specs/006-unified-coordinator-agent/quickstart.md` 完成 4 个端到端场景验收
- [x] T028 [P] 更新 `README.md` 介绍主聊天 Agent 与任务协同架构
- [x] T029 运行全量测试套件 `pnpm test` 与 `pnpm lint` 确保 100% 通过无告警

---

## Dependencies & Execution Plan

```text
Phase 1 (Data Model & DB) + Phase 2 (Subagent Specialists)
    │
    ▼
Phase 3 (US1: 通用会话入口 & 意图识别)
    │
    ▼
Phase 4 (US2: 子 Agent 派发 & 代理提问)
    │
    ▼
Phase 5 (US3: Fast-Path 路由 & 就绪生成落盘)  ===> [🎯 MVP 达成]
    │
    ├── Phase 6 (US4: 跨资产上下文复用)
    └── Phase 7 (US5: 历史兼容 & MCP 校验)
            │
            ▼
        Phase 8 (Polish & Quickstart 验收)
```

**MVP 建议范围**: **T001 ~ T022**（Phase 1 至 Phase 5），完成核心协同与闭环。
