# Tasks: 文生图 MVP（对话 + 本地资产收藏）

**Input**: Design documents from `/specs/001-text-to-image-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 规格未要求 TDD；本列表不含强制测试任务。实现后按 `quickstart.md` 手工验收。

**Organization**: 按用户故事分组，便于增量交付。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: US1–US4 对应 spec 用户故事
- 描述须含明确文件路径

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 初始化 Next.js 全栈工程与基础工具链

- [x] T001 按 plan 初始化 Next.js 15 + TypeScript 应用（App Router）于仓库根目录（`package.json`、`tsconfig.json`、`next.config.ts`、`app/layout.tsx`、`app/globals.css`）
- [x] T002 安装核心依赖：`openai`、`zod`、`drizzle-orm`、`better-sqlite3`（及对应 `@types`）、`ulid`；配置 `pnpm`/`npm` 脚本（`dev`/`build`/`lint`）于 `package.json`
- [x] T003 [P] 配置 ESLint/Prettier（或 Biome）于仓库根（如 `eslint.config.mjs`）
- [x] T004 [P] 完善 `.env.example` 与 README 本地启动说明（`POE_API_KEY`、`SURREAL_DATA_DIR`、`SURREAL_CONTEXT_MESSAGE_LIMIT`）；确认 `.gitignore` 忽略 `data/`、`.env`
- [x] T005 [P] 创建目录骨架：`lib/`、`components/`、`tests/unit/`、`tests/contract/` 及 `app/(app)/`、`app/api/` 占位

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事共享的环境、DB、存储与 Provider 抽象

**⚠️ CRITICAL**: 本阶段完成前不得开始用户故事实现

- [x] T006 实现环境变量读取与校验于 `lib/env.ts`（仅 `process.env`；导出 `poeApiKey`/`dataDir`/`contextLimit`；缺 key 时标记未配置）
- [x] T007 实现 SQLite 连接与 Drizzle schema（Conversation/Message/Asset/GenerationProfile）于 `lib/db/schema.ts`、`lib/db/client.ts`；启动时确保 `data/` 与库文件存在
- [x] T008 [P] 实现 `StorageBackend` 接口与 `LocalFsStorage` 于 `lib/storage/types.ts`、`lib/storage/local-fs.ts`（防路径穿越；按 `storageKey` 读写删）
- [x] T009 [P] 实现 `ImageProvider` 接口于 `lib/providers/types.ts`；添加模型白名单常量（对齐 `contracts/models-allowlist.json`）于 `lib/models/allowlist.ts`
- [x] T010 实现 `PoeProvider`（`openai` SDK、`stream: false`、图像 URL 提取）于 `lib/providers/poe.ts` 与 `lib/providers/extract-images.ts`
- [x] T011 实现上下文窗口组装（全局 system + 最近 N 条）于 `lib/generation/context-window.ts`
- [x] T012 实现 `GET /api/health` 于 `app/api/health/route.ts`（返回 `ok`、`poeConfigured`，不回显密钥）
- [x] T013 [P] 实现 `GET /api/models` 于 `app/api/models/route.ts`（返回白名单与 `defaultModel`）
- [x] T014 实现全局 Profile 仓储（读/写单例 `default`）于 `lib/db/profile.ts` 与 `GET|PUT /api/profile` 于 `app/api/profile/route.ts`

**Checkpoint**: `curl /api/health` 与 `/api/models`、`/api/profile` 可用；DB/本地目录可创建

---

## Phase 3: User Story 1 - 文生图对话出图 (Priority: P1) 🎯 MVP

**Goal**: 选模型、发提示词、多轮对话中看到生成图；失败有可读错误

**Independent Test**: 配置 `POE_API_KEY` 后仅用对话页完成「选模型 → 提示词 → 见底图」

### Implementation for User Story 1

- [x] T015 [P] [US1] 实现会话仓储 CRUD 于 `lib/db/conversations.ts`、`lib/db/messages.ts`
- [x] T016 [US1] 实现 `GET|POST /api/conversations` 与 `GET|DELETE /api/conversations/[conversationId]` 于 `app/api/conversations/route.ts`、`app/api/conversations/[conversationId]/route.ts`
- [x] T017 [US1] 实现生成编排（写 user 消息 → 调 Poe → 落盘图片 → 写 assistant 消息与 Asset）于 `lib/generation/persist.ts`、`lib/generation/run.ts`
- [x] T018 [US1] 实现 `POST /api/generate` 于 `app/api/generate/route.ts`（对齐 `contracts/openapi.yaml`；无 key/空 prompt/无图时返回明确错误）
- [x] T019 [US1] 实现 `GET /api/assets/[assetId]/file` 于 `app/api/assets/[assetId]/file/route.ts`（供对话内嵌图）
- [x] T020 [US1] 实现对话 UI（会话列表/新建、模型选择、消息时间线、输入框、加载与错误态）于 `app/(app)/page.tsx`、`components/chat/`
- [x] T021 [US1] 对接前端调用 generate/conversations API，展示助手消息中的图片（`fileUrl`）于 `components/chat/MessageList.tsx` 等

**Checkpoint**: 主路径可出图并在对话中显示；对应 US1 验收场景

---

## Phase 4: User Story 2 - 生成结果本地落盘 (Priority: P1)

**Goal**: 成功生成的图稳定落盘且元数据完整；重启后仍可访问

**Independent Test**: 成功生成后重启应用，资产仍可打开

### Implementation for User Story 2

- [x] T022 [US2] 强化落盘事务策略（文件写入失败回滚元数据；文件成功但 DB 失败时清理孤儿文件）于 `lib/generation/persist.ts`
- [x] T023 [US2] 实现 `GET /api/assets`（分页）与 `GET /api/assets/[assetId]` 于 `app/api/assets/route.ts`、`app/api/assets/[assetId]/route.ts`
- [x] T024 [US2] 在生成响应与资产元数据中确保含 prompt/model/createdAt/fileUrl；补充单位测试覆盖 extract+storageKey 于 `tests/unit/extract-images.test.ts`、`tests/unit/local-fs.test.ts`
- [x] T025 [US2] 按 `quickstart.md` Scenario A/B 验证重启后文件仍存在（文档记录验证步骤于 `specs/001-text-to-image-mvp/quickstart.md` 勾选备注或 README 开发节）

**Checkpoint**: SC-002 可演示；资产 API 可列出落盘结果

---

## Phase 5: User Story 3 - 资产浏览与收藏/删除 (Priority: P2)

**Goal**: 资产库浏览、收藏筛选、确认后硬删除

**Independent Test**: 不发起新生成，仅在资产库完成浏览/收藏/筛选/删除

### Implementation for User Story 3

- [x] T026 [P] [US3] 实现 `PUT /api/assets/[assetId]/favorite` 于 `app/api/assets/[assetId]/favorite/route.ts`
- [x] T027 [US3] 实现 `DELETE /api/assets/[assetId]?confirm=true`（删元数据+本地文件；缺文件仍清库）于 `app/api/assets/[assetId]/route.ts`
- [x] T028 [US3] 实现资产库页面（网格、收藏切换、仅收藏筛选、删除确认）于 `app/(app)/assets/page.tsx`、`components/assets/`
- [x] T029 [US3] 导航串联对话页与资产库于 `components/AppNav.tsx`（或 `app/(app)/layout.tsx`）

**Checkpoint**: US3 验收场景（含删除）通过

---

## Phase 6: User Story 4 - 系统提示词可调 (Priority: P2)

**Goal**: 设置页编辑全局系统提示词；新生成生效；历史不回溯

**Independent Test**: 修改并保存后新生成使用新提示词

### Implementation for User Story 4

- [x] T030 [US4] 完善设置页 UI（系统提示词文本域、默认模型、保存/恢复默认）于 `app/(app)/settings/page.tsx`、`components/settings/ProfileForm.tsx`
- [x] T031 [US4] 确保 `lib/generation/run.ts` / `context-window.ts` 每次生成读取最新 Profile；设置页调用 `PUT /api/profile`
- [x] T032 [US4] 导航加入设置入口；空提示词与超长校验提示于设置表单与 API

**Checkpoint**: US4 验收场景通过；历史消息不被改写

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 文档、安全与端到端验收

- [x] T033 [P] 更新根 `README.md` 与 `docs/plan/tech-stack-draft.md`，对齐实际脚本与目录
- [x] T034 [P] 确认服务端组件/Route Handler 不把 `POE_API_KEY` 泄漏到客户端 bundle（检查 `lib/env.ts` 仅在服务端引用）
- [x] T035 按 `specs/001-text-to-image-mvp/quickstart.md` 跑通 Scenario A–E 并修复阻塞缺陷
- [x] T036 [P] 补充 AGPL 声明与依赖许可证注意点于 `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → **Phase 2 Foundational**（阻塞所有故事）
- **US1 (Phase 3)** → 建议先完成（MVP）
- **US2 (Phase 4)** 依赖 US1 的生成/落盘路径
- **US3 / US4** 依赖 Foundational；可与彼此并行，但 US3 依赖资产已由 US1/US2 产生更易验收
- **Polish** 在目标故事完成后

### User Story Dependencies

- **US1**: Foundational 完成后即可；MVP 核心
- **US2**: 依赖 US1 生成链路；强化持久化与资产读取
- **US3**: 依赖资产记录存在（US1/US2）；API 可先于有数据时用 fixture
- **US4**: 仅依赖 Profile API（Foundational T014）；可与 US1 并行，但需接入 generate 才完整验收

### Parallel Opportunities

- T003/T004/T005 并行
- T008/T009 并行；T013 可与 T012 后并行于 Profile 前
- T015 与部分 UI 骨架可并行
- T026 可与 US4 的 T030 并行
- T033/T034/T036 并行

---

## Parallel Example: User Story 1

```bash
# 仓储与文件服务可先于完整 UI：
Task: "T015 会话/消息仓储 lib/db/conversations.ts + messages.ts"
Task: "T019 资产文件路由 app/api/assets/[assetId]/file/route.ts"

# 然后串行：
Task: "T017 生成编排 → T018 POST /api/generate → T020/T021 对话 UI"
```

---

## Parallel Example: US3 + US4

```bash
Task: "T026 favorite API"
Task: "T030 settings UI"
# 然后各自完成页面与 generate 接入
```

---

## Implementation Strategy

### MVP First（仅 US1 + 必要落盘）

1. Phase 1 + Phase 2
2. Phase 3 US1（含生成时落盘以便对话显图）
3. **STOP**：按 quickstart Scenario A 验收
4. 再推进 US2 强化 → US3 → US4 → Polish

### Incremental Delivery

1. Setup + Foundational
2. US1 对话出图 → Demo
3. US2 持久化验收 → Demo
4. US3 资产库 → Demo
5. US4 系统提示词 → Demo
6. Polish + quickstart A–E

---

## Notes

- 默认模型 `GPT-Image-1.5`；上下文默认 N=6
- 密钥只读环境变量；本地数据在 `SURREAL_DATA_DIR`
- 任务格式：`- [ ] Txxx ...` + 路径；故事任务含 `[USx]`
- 下一命令：`/speckit-implement`（建议从 T001 起，或声明只做 MVP=US1）
