# Feature Specification: 轻量生图 Agent（反向拷问澄清）

**Feature Branch**: `002-image-agent-grill`

**Created**: 2026-11-08

**Status**: Clarified

**Input**: User description: "用户发送内容先交给文本对话模型（GPT-4o / GPT-4o-Mini），打造成轻量 AI 生图 Agent；内置类似 grill-me 的反向拷问，多轮澄清后再调用生图模型；可强制不再反问。目标：减少返工与生图 credits 消耗。"

## Clarifications

### Session 2026-11-08

- Q: Agent 确认可出图后如何触发生图？ → A: Agent 提议最终提示词并询问；用户确认（或点「立即生成」）后再调生图模型。
- Q: 如何强制不再反问？ → A: 自然语言（如「直接生成」）与工具栏「跳过澄清」按钮均支持。
- Q: 澄清用主模型默认？ → A: 默认 `GPT-4o-Mini`；设置可后续扩展换 `GPT-4o`。
- Q: 发送旁 ✨ 提示词优化按钮？ → A: 本 feature 移除/隐藏，由 Agent 澄清替代。
- Q: 单轮反问密度？ → A: 每轮 2–4 个相关澄清点 + 一条建议提示词草案；禁止一次抛出海量无关问题。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent 澄清后再生图 (Priority: P1)

开发者在对话中用自然语言描述想要的图（可能很模糊）。系统将消息发给文本 Agent（非生图模型）。Agent 以「反向拷问」方式澄清关键视觉属性，并给出建议提示词草案。当用户确认后，系统才调用生图模型并把结果展示在同一会话中。

**Why this priority**: 核心价值；没有澄清环则本 feature 不成立。

**Independent Test**: 仅用对话：发送「帮我生成一张狗的图片」→ 收到反问与建议提示词 → 确认 → 出现生成图片。

**Acceptance Scenarios**:

1. **Given** 用户发送模糊需求，**When** Agent 回复，**Then** 回复包含 2–4 个相关澄清点（或说明已足够清晰）以及一条建议提示词草案，且**尚未**调用生图模型。
2. **Given** Agent 已给出建议提示词并询问是否生成，**When** 用户确认（自然语言或「立即生成」），**Then** 系统使用约定提示词调用生图模型，并将图片消息追加到会话。
3. **Given** 用户在确认前继续补充细节，**When** Agent 再回复，**Then** 基于最新信息更新澄清与建议提示词，仍不自动生图。

---

### User Story 2 - 跳过澄清强制出图 (Priority: P1)

开发者可随时要求跳过后续拷问，尽快出图（接受可能不够精确）。

**Why this priority**: 与澄清同等必要，避免 Agent 过度盘问阻塞工作流。

**Independent Test**: 发送模糊提示后立刻点「跳过澄清」或说「直接生成」，应进入生图路径（可带 Agent 基于已有信息的最佳提示词）。

**Acceptance Scenarios**:

1. **Given** 会话中已有用户草稿，**When** 用户点击「跳过澄清」，**Then** Agent/系统基于当前已知信息合成提示词并调用生图，不再继续反问。
2. **Given** 用户自然语言表示「直接生成 / just generate / 不要再问了」等，**When** Agent 处理该轮，**Then** 行为与跳过澄清等价：进入生图而非新一轮拷问。

---

### User Story 3 - 确认门闩与立即生成 (Priority: P2)

当 Agent 认为信息足够时，明确展示「建议提示词 + 是否生成」；用户可用一键「立即生成」确认，无需再打字。

**Why this priority**: 降低确认摩擦，落实「非自动生图」决策。

**Independent Test**: Agent 进入 ready 状态后，界面出现「立即生成」；点击后仅调用一次生图。

**Acceptance Scenarios**:

1. **Given** Agent 回复标记为「可生成」状态，**When** UI 渲染该消息，**Then** 显示「立即生成」操作。
2. **Given** 用户点击「立即生成」，**When** 请求完成，**Then** 使用该条建议提示词生图；不重新发起拷问。

---

### User Story 4 - 移除旧✨优化入口 (Priority: P2)

对话输入区不再提供独立的「✨ 优化提示词 / 撤销」旁路；优化与澄清统一由 Agent 对话完成。

**Why this priority**: 避免双路径混淆；澄清结论已明确移除。

**Independent Test**: 对话页发送区旁无✨/撤销优化图标；发送走 Agent 路径。

**Acceptance Scenarios**:

1. **Given** 打开对话页，**When** 查看输入工具栏，**Then** 不存在旧的提示词优化/撤销图标。
2. **Given** 用户发送消息，**When** 后端处理，**Then** 默认进入文本 Agent，而非直接 `ImageProvider.generate`。

---

### Edge Cases

- 未配置 `POE_API_KEY`：阻止 Agent 与生图，提示配置。
- Agent 文本调用失败：可读错误，不误触发生图。
- 生图调用失败：保留澄清历史，错误可见，可重试生成。
- 用户确认时建议提示词为空：拒绝生图并提示 Agent 重试。
- 「跳过澄清」时信息极少：仍生成，但提示词基于有限信息；可在回复中注明假设。
- 并发：同一会话同时多次「立即生成」应串行或拒绝第二请求，避免重复扣点。
- 多语言 UI：Agent 可用用户界面语言或用户消息语言交流（实现可默认跟随 UI locale）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 用户在对话中发送的内容 MUST 首先由文本对话模型（生图 Agent）处理，MUST NOT 默认直接发送给生图模型。
- **FR-002**: 生图 Agent MUST 具备反向拷问能力：在意图不足时提出澄清问题；每轮 MUST 限制为约 2–4 个相关问题，并 SHOULD 附带一条建议提示词草案。
- **FR-003**: 生图 Agent MUST NOT 在用户确认（或显式跳过澄清）之前调用生图模型。
- **FR-004**: 系统 MUST 支持用户通过自然语言表示「跳过澄清/直接生成」，使本轮进入生图流程。
- **FR-005**: 系统 MUST 在对话 UI 提供「跳过澄清」操作，行为与 FR-004 等价。
- **FR-006**: 当 Agent 判定可生成时，系统 MUST 展示建议提示词，并提供「立即生成」确认操作；确认后 MUST 调用现有生图管线落盘。
- **FR-007**: 默认 Agent 模型 MUST 为 `GPT-4o-Mini`（可通过环境变量覆盖）；生图模型仍使用既有白名单/会话选择（默认 `GPT-Image-1.5`）。
- **FR-008**: 对话输入区 MUST 移除既有「✨ 优化提示词 / 撤销优化」旁路控件。
- **FR-009**: Agent 与生图的密钥 MUST 仍仅从环境变量读取；错误 MUST NOT 回显密钥。
- **FR-010**: 同一会话 MUST 保留澄清多轮历史，供后续 Agent 轮次使用（上下文窗口策略可复用/扩展既有 N 限制）。
- **FR-011**: MVP MUST NOT 引入多用户认证、3D/骨骼，或更换存储后端。

### Key Entities

- **AgentTurn（Agent 轮次）**: 文本模型对用户消息的回复；含澄清问题、建议提示词、是否 ready_to_generate 等结构化意图。
- **GenerationGate（生成门闩）**: 用户确认或跳过澄清后的显式放行事件，触发生图。
- **ImageJob（生图任务）**: 使用最终提示词与选定生图模型的一次生成（复用 Asset/Message 落盘）。
- **AgentProfile（Agent 配置）**: Agent 模型 ID、grill 行为约束（每轮问题数上限等）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 对故意模糊的提示（如「生成一只狗」），在用户确认前 100% 的会话**不会**产生生图 API 调用。
- **SC-002**: 用户可在 3 分钟内完成「模糊需求 → 至少一轮澄清 → 确认 → 看到图」的演示路径（Key 有效时）。
- **SC-003**: 用户可通过按钮或自然语言在 1 次操作内跳过澄清并触发生图尝试。
- **SC-004**: 对话页不再出现旧✨优化控件（手工 UI 检查）。
- **SC-005**: 相对「直接生图再反复改提示」的工作流，澄清后一次通过的主观满意度提升（作者自测可接受即可记入 quickstart）。

## Assumptions

- 复用现有会话/消息/资产存储与 Poe OpenAI 兼容 API。
- Agent 输出优先采用可解析结构（如 JSON 块或工具调用约定）；解析失败时降级为纯文本但仍不得擅自生图。
- 「立即生成」使用 Agent 最近一次建议提示词；若用户在确认前手动改了输入框，以门闩携带的提示词为准（实现在 plan 中锁定）。
- grill-me 精髓是「分轮澄清、用户主导、可中止」，不是照搬其全部技能文件或 40+ 问长访谈。
- 中英 UI 已存在；Agent 文案跟随当前 UI locale 为合理默认。
