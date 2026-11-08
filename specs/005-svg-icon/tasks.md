# Tasks: SVG 矢量图标 Agent

**Input**: Design documents from `/specs/005-svg-icon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 规格未强制 TDD；含 sanitize/路径单测与 MCP 校验脚本。

**Organization**: 按用户故事分组，便于独立实现与验收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: US1–US5 对应 spec 用户故事
- 描述须含确切文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 文档与文案对齐

- [x] T001 确认活动功能指针为 `specs/005-svg-icon`（`.specify/feature.json`、`AGENTS.md`）
- [x] T002 [P] 在 `lib/i18n/messages.ts` 增加 SVG 会话/过滤/预览相关中英文案
- [x] T003 [P] 在 `README.md` 补充 SVG Agent、`…/svg/` 落盘与 MCP `generate_svg_icon` 说明

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: kind/assetType 扩展、路径、sanitize、SVG 生成核心——阻塞所有故事

**⚠️ CRITICAL**: 用户故事实现前必须完成

- [x] T004 扩展 `ConversationKind` / `AssetType` 为含 `svg` 于 `lib/db/types.ts`
- [x] T005 更新 `lib/db/conversations.ts`：create/list/map 接受并持久化 `kind=svg`
- [x] T006 [P] 更新 `lib/db/assets.ts`：insert/list/map 支持 `asset_type=svg` 与 `?type=svg` 过滤
- [x] T007 扩展 `lib/storage/asset-path.ts`：`assetType=svg` → `{conversationId}/svg/{assetId}.svg`
- [x] T008 实现 SVG 剥离围栏/截取/安全校验/viewBox+currentColor 约定于 `lib/svg/sanitize.ts`
- [x] T009 [P] 单测 sanitize（合法、围栏、缺 viewBox、含 script）于 `tests/unit/svg-sanitize.test.ts`
- [x] T010 实现文本模型 SVG 生成 + sanitize 于 `lib/svg/generate.ts`（使用 `SURREAL_AGENT_MODEL` / OpenAI 兼容客户端）
- [x] T011 实现 SVG 文本落盘辅助于 `lib/svg/persist.ts`（或扩展 `lib/generation/persist.ts`）写入 `image/svg+xml` 与 `assetType=svg`

**Checkpoint**: 单元测试通过；手工可调用 generate+persist 得到 `…/svg/*.svg`

---

## Phase 3: User Story 1 - 新建会话选择 SVG 图标 (Priority: P1) 🎯 MVP

**Goal**: 新建会话可选 `image|icon|svg` 并持久化；UI 可识别

**Independent Test**: 新建「SVG」会话 → 列表/详情 `kind=svg`；其它类型不受影响

### Implementation for User Story 1

- [x] T012 [US1] `POST/GET /api/conversations` 接受 `kind=svg` 于 `app/api/conversations/route.ts`
- [x] T013 [US1] `ChatWorkspace` 新建类型切换改为三选一（图片/图标/SVG）于 `components/chat/ChatWorkspace.tsx`
- [x] T014 [US1] 侧栏与会话头展示 SVG 类型标识于 `components/chat/ChatWorkspace.tsx`

**Checkpoint**: 新建 SVG 会话刷新后 kind 仍正确

---

## Phase 4: User Story 2 - SVG Agent 澄清后生成可 CSS 着色/缩放矢量 (Priority: P1)

**Goal**: SVG grill → 门闩 → 单份 SVG；预览可用 CSS 调色/缩放

**Independent Test**: 「可换色购物车 SVG」→ 反问 → 确认 → 预览换色生效；确认前无落盘

### Implementation for User Story 2

- [x] T015 [P] [US2] 新增 SVG grill 系统提示（强调 viewBox、currentColor、确认前不交最终 SVG）于 `lib/agents/svg-grill-system-prompt.ts`
- [x] T016 [US2] `runAgentTurn` 按 `kind=svg` 选用 SVG 提示于 `lib/agents/run-agent-turn.ts`；`app/api/chat/route.ts` 传入 kind
- [x] T017 [US2] 在 `lib/generation/run.ts`（或新 `lib/generation/run-svg.ts`）实现 `kind=svg` 门闩路径：调 `lib/svg/generate.ts` → persist → 挂 assistant 消息
- [x] T018 [US2] `POST /api/generate` 在 svg 会话走矢量路径于 `app/api/generate/route.ts`（忽略 sizes 批量）
- [x] T019 [US2] 新增 `components/chat/SvgPreview.tsx`：内联 sanitize 后的 SVG，提供 color/size 控件证明 CSS 可控
- [x] T020 [US2] `ChatWorkspace` / 消息渲染对接 SvgPreview 与「立即生成」于 `components/chat/ChatWorkspace.tsx`、`components/chat/AgentReplyCard.tsx`

**Checkpoint**: quickstart Web 步骤 1–4 可演示

---

## Phase 5: User Story 3 - 收藏与资产库类型过滤含 SVG (Priority: P1)

**Goal**: SVG 可收藏；资产库可滤 SVG

**Independent Test**: 收藏 SVG → 类型「SVG」可见；「图片/图标」不可见

### Implementation for User Story 3

- [x] T021 [US3] `GET /api/assets` 文档化并支持 `type=svg` 于 `app/api/assets/route.ts`（若 T006 已覆盖则核对响应字段）
- [x] T022 [US3] `AssetLibrary` 类型过滤增加 SVG，展示类型徽标与 SVG 缩略预览于 `components/assets/AssetLibrary.tsx`
- [x] T023 [US3] 确认聊天收藏对 SVG 资产可用（`FavoriteImage` 或 SvgPreview 角标）于 `components/chat/FavoriteImage.tsx` / `SvgPreview.tsx`

**Checkpoint**: 「SVG + 收藏」组合可定位资产

---

## Phase 6: User Story 4 - 按会话落盘 SVG (Priority: P2)

**Goal**: 文件位于 `…/<convId>/svg/`；file 路由正确 MIME

**Independent Test**: 生成后磁盘路径与下载 Content-Type 正确

### Implementation for User Story 4

- [x] T024 [US4] 核对 `app/api/assets/[assetId]/file/route.ts` 对 `image/svg+xml` 正确返回
- [x] T025 [P] [US4] 更新 `specs/005-svg-icon/quickstart.md` 目录检查说明（若实现有偏差则同步）

**Checkpoint**: 打开落盘 `.svg` 为合法文本且含 viewBox

---

## Phase 7: User Story 5 - MCP 直出 SVG 图标 (Priority: P2)

**Goal**: MCP `generate_svg_icon` 无反问落盘

**Independent Test**: 工具调用返回 `.svg` absolutePath 且文件存在

### Implementation for User Story 5

- [x] T026 [US5] 实现 `mcpGenerateSvgIcon` 于 `lib/mcp/generate.ts`（`source=mcp` + `kind=svg`）
- [x] T027 [US5] 在 `mcp/server.ts` 注册 `generate_svg_icon`
- [x] T028 [P] [US5] 新增 `scripts/verify-mcp-svg.ts` 与 `package.json` 脚本 `mcp:verify-svg`
- [x] T029 [US5] 更新 `specs/005-svg-icon/contracts/mcp-tools.md` / `README.md` 工具列表

**Checkpoint**: `pnpm mcp:verify-svg` 与 `pnpm mcp:stdio`（含新工具名）通过

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T030 [P] 同步 `AGENTS.md` 活动功能描述
- [x] T031 按 `specs/005-svg-icon/quickstart.md` 跑通 Web + 目录 + MCP，修复阻塞缺陷
- [x] T032 [P] 补充/收紧 sanitize 单测与路径单测于 `tests/unit/svg-sanitize.test.ts`、`tests/unit/asset-path.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational（阻塞全部 US）
- **US1** 依赖 Foundational（kind=svg API/UI）
- **US2** 依赖 US1 + Foundational（sanitize/generate）
- **US3** 依赖 US2 产出资产（过滤可部分并行）
- **US4** 与 Foundational persist 相关；US2 后核对
- **US5** 依赖 Foundational SVG 生成能力（可与 US3 并行）
- Polish 在所需故事完成后

### User Story Dependencies

```text
Foundational (types, path, sanitize, generate)
    ├── US1 (选 SVG 会话) ──► US2 (Agent + 预览)
    │                           ├── US3 (过滤/收藏)
    │                           └── US4 (路径/MIME)
    └── US5 (MCP) ← 可与 US3 并行（需 generate/persist）
```

### Parallel Opportunities

- T002/T003；T006/T009；T015 与 T008 注意依赖
- T028/T030/T032 可并行
- US5 与 US3 在 US2 核心完成后可并行

### Parallel Example: Foundational

```bash
Task: "更新 lib/db/assets.ts 支持 asset_type=svg"
Task: "单测 tests/unit/svg-sanitize.test.ts"
```

### Parallel Example: User Story 5

```bash
Task: "scripts/verify-mcp-svg.ts"
Task: "更新 README.md 工具列表"
```

---

## Implementation Strategy

### MVP First

1. Phase 1–2 Foundational  
2. US1 + US2（能选 SVG、澄清、生成、CSS 预览）→ **STOP 验收**  
3. 再叠加 US3/US4/US5  

### Suggested MVP scope

**T001–T020**（Setup + Foundational + US1 + US2）

### Incremental Delivery

1. sanitize + generate 可先脚本验证  
2. 再接线会话 kind 与 Chat UI  
3. 资产库过滤 → MCP → quickstart 全绿  

---

## Notes

- 不走 ImageProvider；单份 SVG；默认 `currentColor`  
- 内联预览前必须经过 sanitize  
- 格式校验：全部任务为 `- [ ] Txxx …`，故事任务带 `[USn]`，含文件路径
