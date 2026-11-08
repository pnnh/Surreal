# Tasks: 轻量生图 Agent（反向拷问澄清）

**Input**: Design documents from `/specs/002-image-agent-grill/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 规格未强制 TDD；含少量解析单测即可。

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 更新 `lib/env.ts` 与 `.env.example`：新增 `SURREAL_AGENT_MODEL`（默认 `GPT-4o-Mini`）；文档说明移除 UI 旁路优化
- [x] T002 [P] 扩展 i18n（`lib/i18n/messages.ts`）：跳过澄清、立即生成、Agent 思考中等文案（中英）
- [x] T003 [P] 为 `messages` 表增加 `meta_json` 列（迁移/启动 DDL）于 `lib/db/client.ts` 与读写辅助

---

## Phase 2: Foundational

- [x] T004 定义 AgentReply zod schema 与类型于 `lib/agents/types.ts`
- [x] T005 [P] 编写 grill 系统提示于 `lib/agents/grill-system-prompt.ts`（2–4 问、建议提示词、用户可跳过、确认前不生图）
- [x] T006 [P] 实现自然语言跳过检测于 `lib/agents/detect-skip.ts`（中英短语）
- [x] T007 实现 `runAgentTurn`（调文本模型、解析 JSON、失败降级）于 `lib/agents/run-agent-turn.ts`
- [x] T008 实现 `POST /api/chat` 于 `app/api/chat/route.ts`（持久化 user/assistant+meta；`skipClarification` 时可串联生图）
- [x] T009 调整 `POST /api/generate` 为门闩语义（要求 `source`+非空 `prompt`）于 `app/api/generate/route.ts`

**Checkpoint**: curl `/api/chat` 仅文本；带 skip 或 `/api/generate` 才生图

---

## Phase 3: User Story 1 - Agent 澄清后再生图 (P1) 🎯

**Goal**: 模糊需求先拷问，确认后再出图

**Independent Test**: 「狗的图片」→ 反问 → 确认 → 出图

- [x] T010 [US1] ChatWorkspace 发送改为 `/api/chat`；渲染 Agent 澄清列表与建议提示词于 `components/chat/ChatWorkspace.tsx`
- [x] T011 [US1] 当 `readyToGenerate` 时展示「立即生成」，调用 `/api/generate`（source=confirm, prompt=suggestedPrompt）
- [x] T012 [US1] 单测：JSON 解析与降级于 `tests/unit/agent-parse.test.ts`

**Checkpoint**: Scenario A 通过

---

## Phase 4: User Story 2 - 跳过澄清 (P1)

**Goal**: 按钮 + 自然语言强制出图

- [x] T013 [US2] 输入区增加「跳过澄清」按钮（`skipClarification: true`）于 `components/chat/ChatWorkspace.tsx`
- [x] T014 [US2] 接入 `detect-skip`：用户文本命中时服务端按 skip 处理于 `lib/agents/run-agent-turn.ts` / `app/api/chat/route.ts`
- [x] T015 [US2] 单测跳过短语于 `tests/unit/detect-skip.test.ts`

**Checkpoint**: Scenario B 通过

---

## Phase 5: User Story 3 - 确认门闩 UX (P2)

- [x] T016 [US3] Agent 消息卡片展示建议提示词只读预览 +「立即生成」加载/禁用态于 `components/chat/AgentReplyCard.tsx`
- [x] T017 [US3] 防止同一会话并发生图（简单 in-flight 锁）于 `lib/generation/run.ts` 或 chat/generate 路由

**Checkpoint**: ready 态一键生成稳定

---

## Phase 6: User Story 4 - 移除 ✨ (P2)

- [x] T018 [US4] 移除 ChatWorkspace 优化/撤销 UI 与相关状态；删除 `components/chat/PromptActionIcon.tsx` 引用
- [x] T019 [US4] 删除或停用 `app/api/optimize-prompt/route.ts` 与 `lib/generation/optimize-prompt.ts`；清理 env 文档中旁路说明

**Checkpoint**: Scenario C 通过

---

## Phase 7: Polish

- [x] T020 [P] 更新 `README.md` / `AGENTS.md`：当前功能为生图 Agent；活跃规格 `002-image-agent-grill`
- [x] T021 按 `quickstart.md` 跑 Scenario A–D 并修阻塞缺陷

---

## Dependencies

- Setup → Foundational → US1 → US2（可部分并行于 US1 UI 后）→ US3 → US4 → Polish
- MVP：T001–T015 即可演示核心价值

## Parallel opportunities

- T002/T003；T005/T006；T012/T015；T018 与 T016 注意同一文件冲突

## Implementation Strategy

1. Foundational API 可先用 curl 验证「确认前不生图」
2. 再改 Chat UI
3. 最后删 ✨ 与文档
