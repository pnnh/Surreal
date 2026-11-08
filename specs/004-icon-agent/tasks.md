# Tasks: 生图标 Agent

**Input**: Design documents from `/specs/004-icon-agent/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 规格未强制 TDD；含少量路径/尺寸/schema 单测与 MCP 校验脚本即可。

**Organization**: 按用户故事分组，便于独立实现与验收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: US1–US5 对应 spec 用户故事
- 描述须含确切文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 文档与类型约定对齐，不引入新运行时依赖

- [x] T001 确认活动功能指针为 `specs/004-icon-agent`（`.specify/feature.json`、`AGENTS.md`）
- [x] T002 [P] 在 `lib/i18n/messages.ts` 增加图标会话/尺寸/类型过滤相关中英文案
- [x] T003 [P] 在 `README.md` 补充图标 Agent、目录布局与 MCP `generate_icon` 说明

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 会话 kind、资产类型、按会话落盘路径——阻塞所有故事

**⚠️ CRITICAL**: 用户故事实现前必须完成

- [x] T004 在 `lib/db/types.ts` 增加 `ConversationKind`（`image|icon`）与 `AssetType`（`image|icon`），并扩展 `Conversation` / `Asset`
- [x] T005 在 `lib/db/client.ts` 为 `conversations.kind`、`assets.asset_type` 做启动迁移（默认 `image`），并更新相关索引如需
- [x] T006 [P] 更新 `lib/db/conversations.ts`：create/list/get 读写 `kind`；支持按 `kind` 过滤
- [x] T007 [P] 更新 `lib/db/assets.ts`：insert/list/map 读写 `asset_type`；`listAssets` 支持 `type` 过滤
- [x] T008 实现路径辅助（如 `lib/storage/asset-path.ts`）：`storageKey = {conversationId}/{images|icons}/{assetId}.{ext}`
- [x] T009 改造 `lib/generation/persist.ts`：按 `assetType` 写入新 `storageKey`；`insertAsset` 写入 `asset_type` 与 width/height
- [x] T010 [P] 实现尺寸校验工具于 `lib/icons/sizes.ts`（默认 `[16,32,64]`，上限 12，范围 16–1024）
- [x] T011 [P] 单测尺寸校验与 storageKey 拼装于 `tests/unit/icon-sizes.test.ts`、`tests/unit/asset-path.test.ts`

**Checkpoint**: 手工/单测确认 DB 列存在；persist 写入 `…/<convId>/images|icons/…`；旧扁平路径不再作为写入目标

---

## Phase 3: User Story 1 - 新建会话选择图片或图标 (Priority: P1) 🎯 MVP

**Goal**: 新建会话可选 `image|icon` 并持久化；UI 可识别会话类型

**Independent Test**: 新建「图标」会话 → 列表/详情带 `kind=icon`；新建「图片」会话行为不变

### Implementation for User Story 1

- [x] T012 [US1] `POST/GET /api/conversations` 支持 `kind`（及可选 query 过滤）于 `app/api/conversations/route.ts`
- [x] T013 [US1] Chat 新建流程改为选择 image/icon（对话框或分段按钮）于 `components/chat/ChatWorkspace.tsx`
- [x] T014 [US1] 会话侧栏展示类型标识（图标/图片）于 `components/chat/ChatWorkspace.tsx`（或抽取小组件）
- [x] T015 [P] [US1] 确保会话详情 API 返回 `kind` 于 `app/api/conversations/[conversationId]/route.ts`

**Checkpoint**: 两次新建分别得到 `kind=image` 与 `kind=icon` 且刷新后仍正确

---

## Phase 4: User Story 2 - 图标 Agent 反问后批量出图 (Priority: P1)

**Goal**: 图标会话走平行 grill Agent；敲定尺寸后门闩批量生图

**Independent Test**: 「购物车图标」→ 反问含尺寸 → 确认 → 同消息多张图标；确认前无生图调用

### Implementation for User Story 2

- [x] T016 [P] [US2] 扩展 `lib/agents/types.ts`：`suggestedSizes` 进入 `agentReplySchema` 与 meta 类型
- [x] T017 [P] [US2] 新增图标 grill 系统提示于 `lib/agents/icon-grill-system-prompt.ts`（尺寸列表、透明底、2–4 问、确认前不生图）
- [x] T018 [US2] `runAgentTurn` / `app/api/chat/route.ts` 按 `conversation.kind` 选择 image/icon 提示与 schema
- [x] T019 [US2] 扩展 `lib/generation/run.ts`：支持 `sizes[]` + `assetType`；按尺寸循环生成并挂同一 assistant message；跳过时默认尺寸
- [x] T020 [US2] `POST /api/generate` 接受 `sizes`，图标会话批量门闩于 `app/api/generate/route.ts`
- [x] T021 [US2] `AgentReplyCard` / `ChatWorkspace`：展示建议尺寸；「立即生成」携带 `suggestedPrompt`+`sizes` 于 `components/chat/AgentReplyCard.tsx`、`components/chat/ChatWorkspace.tsx`
- [x] T022 [P] [US2] 单测 Agent JSON 含 `suggestedSizes` 解析于 `tests/unit/agent-parse.test.ts`（或新建 `tests/unit/icon-agent-parse.test.ts`）

**Checkpoint**: quickstart Web 路径步骤 1–5 可演示（收藏可留到 US3）

---

## Phase 5: User Story 3 - 收藏与资产库类型过滤 (Priority: P1)

**Goal**: 图标可收藏；资产库按类型过滤

**Independent Test**: 收藏图标 → 资产库选「图标」可见；选「普通图片」不可见

### Implementation for User Story 3

- [x] T023 [US3] `GET /api/assets` 支持 `?type=image|icon` 于 `app/api/assets/route.ts`（响应含 `assetType`）
- [x] T024 [US3] `AssetLibrary` 增加类型过滤（全部/图片/图标）并展示类型标识于 `components/assets/AssetLibrary.tsx`
- [x] T025 [US3] 确认聊天内 `FavoriteImage` 对图标资产仍可用（必要时按 `assetType` 微调展示）于 `components/chat/FavoriteImage.tsx` / `ChatWorkspace.tsx`

**Checkpoint**: 类型过滤与「图标 + 收藏」组合可找到目标资产

---

## Phase 6: User Story 4 - 按会话组织的本地资产目录 (Priority: P2)

**Goal**: 图片/图标均落在会话子目录；文档化可清空旧 data

**Independent Test**: 各生成一次 → 磁盘上同时存在 `…/images/…` 与 `…/icons/…`

### Implementation for User Story 4

- [x] T026 [US4] 核对普通图片路径走 `images/`（含 MCP `generate_image` 与 Web 图片会话）于 `lib/generation/persist.ts`、`lib/mcp/generate.ts`、`lib/generation/run.ts`
- [x] T027 [P] [US4] 更新 `specs/004-icon-agent/quickstart.md` / `README.md`：说明可删除旧扁平 `data/assets/*` 文件后重建
- [x] T028 [US4] 修正资产文件读取：`app/api/assets/[assetId]/file/route.ts`（及删除逻辑）使用完整 `storageKey` 子路径

**Checkpoint**: 新旧会话生成均不写回扁平根目录

---

## Phase 7: User Story 5 - MCP 直出图标 (Priority: P2)

**Goal**: MCP `generate_icon` 无反问批量落盘

**Independent Test**: `generate_icon` + sizes `[32,64]` → 资产存在于 `icons/`

### Implementation for User Story 5

- [x] T029 [US5] 实现 `mcpGenerateIcon` 于 `lib/mcp/generate.ts`（创建 `source=mcp` + `kind=icon` 会话；默认尺寸；返回 absolutePath）
- [x] T030 [US5] 在 `mcp/server.ts` 注册 `generate_icon` 工具（参数：prompt、sizes?、model?）
- [x] T031 [P] [US5] 新增校验脚本 `scripts/verify-mcp-icon.ts` 与 `package.json` 脚本 `mcp:verify-icon`
- [x] T032 [US5] 更新 `.cursor/mcp.json` 相关 README/合约说明（工具列表含 `generate_icon`）于 `README.md`、`specs/004-icon-agent/contracts/mcp-tools.md`

**Checkpoint**: `pnpm mcp:verify-icon` 通过；Cursor 可列出并调用该工具

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 文档、验收与收尾

- [x] T033 [P] 同步 `AGENTS.md` 活动功能描述与已完成基线（若 implement 完成则更新）
- [x] T034 按 `specs/004-icon-agent/quickstart.md` 跑通 Web + 目录检查 + MCP，修复阻塞缺陷
- [x] T035 [P] 清理无用扁平路径硬编码引用（全库检索 `data/assets` / `storageKey` 拼接）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup → Foundational**：串行；Foundational 阻塞全部 US
- **US1**：依赖 Foundational（至少 T004–T006、T012）
- **US2**：依赖 Foundational + US1（需要 kind=icon 会话）
- **US3**：依赖 US2 产出图标资产（或可手工 insert 测过滤）；API 过滤可与 US2 部分并行
- **US4**：与 Foundational persist 强相关；收尾核对可在 US2 后
- **US5**：依赖 Foundational + 批量生成能力（US2 的 run/persist）
- **Polish**：所需故事完成后

### User Story Dependencies

```text
Foundational
    ├── US1 (kind 入口) ──► US2 (图标 Agent + 批量)
    │                         ├── US3 (过滤/收藏)
    │                         ├── US4 (目录验收)
    │                         └── US5 (MCP icon)
    └── (image 路径) ─────────► US4
```

### Parallel Opportunities

- T002/T003；T006/T007；T010/T011
- T016/T017；T022 与 T019 注意冲突
- T027/T031/T033/T035 可并行
- US3 的 API（T023）可在 US2 UI 完成前并行

### Parallel Example: Foundational

```bash
Task: "更新 lib/db/conversations.ts 读写 kind"
Task: "更新 lib/db/assets.ts 读写 asset_type"
Task: "实现 lib/icons/sizes.ts"
```

### Parallel Example: User Story 2

```bash
Task: "扩展 lib/agents/types.ts suggestedSizes"
Task: "新增 lib/agents/icon-grill-system-prompt.ts"
```

---

## Implementation Strategy

### MVP First（建议）

1. Phase 1–2 Foundational  
2. US1 + US2（能选图标会话并批量出图）→ **STOP 验收**  
3. 再叠加 US3 过滤、US4 核对、US5 MCP  

### Incremental Delivery

1. Setup + Foundational → 新路径可写  
2. US1 → 类型分流  
3. US2 → 核心价值  
4. US3 → 可管理  
5. US4 → 存储约定闭环  
6. US5 → IDE 工作流  
7. Polish → quickstart 全绿  

### Suggested MVP scope

**T001–T022（Setup + Foundational + US1 + US2）** 即可演示核心：选图标会话 → 反问敲定尺寸 → 批量位图落盘。

---

## Notes

- 不做 SVG；透明底 best-effort  
- 允许清空旧 `data/`；无需迁移 UI  
- 单批尺寸 ≤ 12；跳过澄清默认 `[16,32,64]`  
- 格式校验：全部任务为 `- [ ] Txxx …` 且含路径 / Story 标签（Setup/Foundational/Polish 无 Story）
