# Implementation Plan: 统一主聊天 Agent 与子 Agent 任务协同架构

**Branch**: `006-unified-coordinator-agent` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-unified-coordinator-agent/spec.md`

## Summary

将 Surreal 从“预选类型 + 独立单 Agent 会话”升级为 **Coordinator-Subagent（主协调者-专业子 Agent）** 任务协同架构：
1. **统一入口**：会话类型新增并默认采用通用会话（`general`），用户直接在单输入框自然对话；
2. **意图识别与任务派发**：主 Agent 区分纯闲聊/设置、文生图、位图图标、SVG 矢量，自动构建并派发子任务给领域子 Agent（Image / Icon / SVG Specialist）；
3. **代理反向拷问（HITL Relay）**：子 Agent 的专业 Grill 问题由主 Agent 结构化代为提问，并展示协同专家标签；用户答复后精准路由回子 Agent；
4. **闭环落盘与资产聚合**：达到 `readyToGenerate` 后触发对应生成流水线，资产归集于当前会话，资产库按类型过滤不受影响；
5. **向下兼容**：历史 `001~005` 独立会话与 MCP 直出工具保持 100% 稳定运行。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x（既有）

**Primary Dependencies**: Next.js 15 (App Router)、React 19、`openai` SDK (Poe 兼容端点)、`zod` 校验、SQLite (`better-sqlite3`)、`ulid`

**Storage**: SQLite 会话/消息/任务元数据 + 本地 FS（`data/assets/<convId>/{images|icons|svg}/`）

**Testing**: Vitest 单元测试、`pnpm mcp:stdio` 验证、端到端手动场景快速验证

**Target Platform**: 本机 Next.js Web 应用 + Cursor / Antigravity MCP stdio

**Project Type**: 全栈 Web 增量重构（Coordinator 调度引擎 + 状态机 + 前端交互组件）

**Performance Goals**:
- 纯闲聊/设置咨询：单次 LLM 响应，无冗余串行等待；
- 资产生成派发与首轮拷问：控制在 2~3 秒内（主 Agent 路由 + 子 Agent Grill 结构化返回）；
- 答复直达通道（Fast-path）：处于等待澄清状态时避免主 Agent 重复多轮无意义转述。

**Constraints**:
- 密钥仅环境变量（`POE_API_KEY` 等）；
- MVP 克制：不引入分布式 MQ、多租户或重量级 Agent 框架（如 LangGraph/CrewAI），保持纯 TypeScript 轻量自研状态机；
- 兼容历史会话数据结构。

## Constitution Check

| 原则 | 状态 | 说明 |
| --- | --- | --- |
| I. MVP 克制 | PASS | 聚焦本地自用工作台的意图拆解与子 Agent 协同；无多租户、无云 MQ、无 3D/骨骼超范围功能 |
| II. 密钥隔离 | PASS | 维持环境变量统一注入，报错脱敏 |
| III. Provider 可替换 | PASS | 主 Agent 与子 Agent 均面向 OpenAI 兼容抽象，解耦模型供应商 |
| IV. 存储可演进 | PASS | 任务状态持久化于本地 SQLite 或 Message Meta；资产存储接口保持一致 |
| V. AGPL / 可审计 | PASS | Spec-Kit 全生命周期产物追溯，代码与规范保持一一对应 |

**Post-design re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/006-unified-coordinator-agent/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── coordinator-chat-api.yaml
│   └── subagent-protocol.md
└── tasks.md
```

### Source Code (impacted & added)

```text
lib/db/types.ts                           # ConversationKind += "general"; 新增 SubagentTask 类型
lib/db/conversations.ts                   # 默认 kind 调整与查询兼容
lib/db/tasks.ts                           # (新增) 子任务状态管理与持久化 (或基于 meta)
lib/agents/types.ts                       # 扩展 AgentMessageMeta, CoordinatorReply, TaskStatus
lib/agents/coordinator/
  ├── intent-prompt.ts                    # (新增) 主 Agent 意图识别与任务拆解 System Prompt
  ├── run-coordinator-turn.ts             # (新增) 主协调者入口与调度状态机
  └── context-builder.ts                  # (新增) 任务上下文裁剪与摘要注入
lib/agents/subagents/
  ├── image-specialist.ts                 # (新增) 封装生图 Grill 逻辑
  ├── icon-specialist.ts                  # (新增) 封装位图图标 Grill 逻辑
  └── svg-specialist.ts                   # (新增) 封装 SVG 图标 Grill 逻辑
lib/agents/run-agent-turn.ts              # 委托给 runCoordinatorTurn (或保持旧版兼容分支)
app/api/chat/route.ts                     # 支持通用会话意图路由、任务状态流转与即时生成
components/chat/ChatWorkspace.tsx         # 去除强制三选一；支持通用会话新建与切换
components/chat/AgentReplyCard.tsx        # 增强支持“专业领域协同标签”与任务执行状态卡片
components/chat/SubagentTaskBanner.tsx    # (新增) 显示活跃子任务的挂起状态与快速跳过按钮
lib/i18n/messages.ts                      # 补充通用会话、协同专家、任务状态等中英双语词条
```

**Structure Decision**:
在 `lib/agents/` 下清晰划分 `coordinator/` 与 `subagents/`，将原先揉在 `run-agent-turn.ts` 中的分支逻辑彻底模块化。

## Complexity Tracking

> 无 Constitution 违规。模块解耦提升了代码内聚度，降低了各领域 Grill 提示词的耦合性。
