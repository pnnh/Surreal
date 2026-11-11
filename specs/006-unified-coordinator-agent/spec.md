# Feature Specification: 统一主聊天 Agent 与子 Agent 任务协同架构

**Feature Branch**: `006-unified-coordinator-agent`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "会话不区分类型，统一都是和一个主的聊天Agent进行对话。聊天Agent相当于人机交互入口，它识别用户意图，给子Agent分配任务（生图、生图标、生SVG）。并监控子Agent的任务执行情况，如果子Agent遇到问题需要向用户提问，主Agent来进行转发。由主Agent代为提问，之后再把结果转给子Agent。"

---

## 需求背景与演进目标

在 `specs/001` 至 `specs/005` 的基线实现中，每个会话在创建时必须硬性选择类型（`image`、`icon` 或 `svg`），并强绑定特定领域的反向拷问（Grill）提示词。这带来了以下体验与能力限制：
1. **交互割裂**：用户必须在提问前先确定资产格式，增加了使用门槛。
2. **无法多任务协作**：无法在一个会话内先做角色立绘，再基于相同画风提取武器做成游戏图标。
3. **缺乏通用交互**：普通闲聊、探讨创作方向或修改设置也被强行塞入结构化拷问。

本特性旨在将系统升级为 **Coordinator-Subagent（主协调者-专业子 Agent）** 协同架构：
- 统一会话入口，由主“聊天 Agent”作为全局 HMI。
- 主 Agent 负责意图识别与任务派发，专业子 Agent（生图、位图图标、SVG 矢量）负责领域级 Prompt 优化与生成。
- 子 Agent 的反向拷问（Grill）由主 Agent 统一中继代理，用户答复后再精准路由回子 Agent。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 统一会话入口与自适应意图识别 (Priority: P1)

用户新建会话时无需再做类型预选，直接在统一的聊天框中用自然语言与主 Agent 对话。主 Agent 能够智能识别用户意图：
- **纯闲聊 / 设定咨询**：主 Agent 直接回复，不误触发结构化反问或生成。
- **资产生成诉求**：主 Agent 识别出是插画立绘、位图图标还是 SVG 矢量，自动创建后台子任务并派发给对应专业子 Agent。

**Why this priority**: 统一会话形态是整个 Multi-Agent 架构的基石，消除了建会话时的心智负担。

**Independent Test**: 新建通用会话 → 输入“今天天气不错/你能做什么”得到自然聊天回复；输入“画一个赛博朋克雨夜街道”自动激活生图任务。

**Acceptance Scenarios**:

1. **Given** 用户点击“新建对话”，**When** 进入会话界面，**Then** 无需选择“图片/图标/SVG”弹窗，直接展现通用聊天交互界面。
2. **Given** 用户输入纯咨询或闲聊内容，**When** 主 Agent 处理，**Then** 直接输出自然语言回复，不包含 `readyToGenerate` 或无意义的反问列表。
3. **Given** 用户表达资产创作意向，**When** 主 Agent 分析，**Then** 准确识别目标资产类型并初始化对应的专业子任务。

---

### User Story 2 - 子 Agent 拷问代理转发与人机交互闭环 (Priority: P1)

当用户提出的资产需求存在模糊项时，专业子 Agent 执行领域级 Grill 分析，输出针对该资产的专业澄清问题（如位图图标的尺寸与透明通道、SVG 的单色性与 viewBox、大图的构图与风格）。
子 Agent 不直接暴露给用户，而是将问题回传给主 Agent；主 Agent 以结构化卡片或委派口吻代为向用户发起提问。

**Why this priority**: 核心产品价值；保持高质量反向拷问机制的同时，统一由主 Agent 负责沟通界面的整洁一致。

**Independent Test**: 用户在统一会话中输入“做一个药水图标” → 主 Agent 代为提出图标尺寸与背景风格反问 → 用户界面明确标示“图标专家提出确认项”。

**Acceptance Scenarios**:

1. **Given** 用户的资产描述缺少必要参数，**When** 子 Agent 处理，**Then** 子 Agent 生成针对性的专业澄清问题（约 2~4 项）。
2. **Given** 子 Agent 产生澄清需求，**When** 主 Agent 接收到，**Then** 主 Agent 组织语言向用户提问，并在 UI 上呈现任务协同状态（如“图标专家正在细化需求…”）。
3. **Given** 用户点击“跳过澄清 / 立即生成”或在输入中表达快速生成，**When** 转发给子 Agent，**Then** 子 Agent 设置 `readyToGenerate=true` 并基于默认假设继续。

---

### User Story 3 - 答复精准路由与就绪生成落盘 (Priority: P1)

当会话处于子任务“等待用户澄清”状态时，用户的后续输入由主 Agent 自动识别并精准投递给该挂起的子 Agent。子 Agent 吸收补充信息，若参数齐备则标记为就绪，随后调用底层生成流水线完成落盘，最后由主 Agent 汇总成果卡片呈现给用户。

**Why this priority**: 完成从用户答复到最终资产产出的关键闭环。

**Independent Test**: 针对药水图标反问回复“16和32像素，透明背景” → 子 Agent 确认就绪 → 调用生成流水线落盘 → 主会话收到生成的图标资产。

**Acceptance Scenarios**:

1. **Given** 会话存在等待澄清的子任务，**When** 用户回复具体细节，**Then** 主 Agent 将该输入作为答复转交回该子 Agent。
2. **Given** 子 Agent 获取足够信息达到 `readyToGenerate`，**When** 触发生成，**Then** 资产按照既有规则落盘到对应目录（`images/`、`icons/`、`svg/`）。
3. **Given** 生成完成，**When** 结果返回主会话，**Then** 聊天界面展现资产预览、下载链接与收藏操作。

---

### User Story 4 - 跨资产上下文复用与多任务推进 (Priority: P2)

在同一个统一会话中，用户可以连续提出不同类型的资产需求。主 Agent 能够继承上文建立的世界观、画风或角色设定，在派发后续子任务时提供上下文给新的子 Agent，保持系列资产的风格一致性。

**Why this priority**: 单一类型会话无法做到的杀手级能力，大幅提升美术资产成套产出的效率。

**Independent Test**: 在同一会话中先生成“蓝色火焰法师插图”，随后说“把法师的法杖做成 SVG 矢量图标” → SVG 子 Agent 能继承“蓝色火焰法杖”的特征进行矢量化设计。

**Acceptance Scenarios**:

1. **Given** 会话中已生成前置资产，**When** 用户要求生成另一类型的新资产，**Then** 主 Agent 派发新子任务，并注入前序资产的关键风格上下文。
2. **Given** 用户在一个会话中先后产出图片、位图图标和 SVG，**When** 查看资产库，**Then** 所有资产均关联在该会话下，并可按类型进行全局过滤。

---

### User Story 5 - 向下兼容历史数据与 MCP 服务 (Priority: P2)

升级后的系统对 `specs/001~005` 产生的旧版数据完全向下兼容：
- 已有的 `image`、`icon`、`svg` 类型会话仍可正常打开并继续沿用原有逻辑。
- MCP 服务的直出工具（`generate_image`、`generate_icon`、`generate_svg_icon`）保持稳定无改动。

**Why this priority**: 保证平滑过渡，保护用户已有资产与集成脚本。

**Independent Test**: 打开旧版图标会话 → 仍可正常查看与追加生成；运行 `pnpm mcp:stdio` 测试依旧全绿。

**Acceptance Scenarios**:

1. **Given** 数据库中存在老版本会话，**When** 用户在侧边栏点击打开，**Then** 正常加载历史消息与资产，不抛出异常。
2. **Given** 外部工具通过 MCP 调用直出接口，**When** 请求到达，**Then** 保持无反问直出表现不变。

---

### Edge Cases

- **用户中途放弃或切换话题**：若子任务正在等待澄清，用户突然说“算了，换一个，我们来聊聊剧情”，主 Agent 识别放弃意图，将挂起子任务置为 `cancelled`，切入新话题。
- **复合指令拆解**：用户一条消息包含多个资产请求（如“画一把剑并生成它的 32x32 图标”），主 Agent 按依赖顺序拆解为串行子任务，先推进主图再推进图标。
- **上游服务超时或错误**：子 Agent 调用 Poe API 失败时，返回结构化错误给主 Agent，主 Agent 礼貌告知用户并支持重试该任务，而不让整个主会话崩溃。
- **超长对话 Token 控制**：主 Agent 向子 Agent 派发任务时仅传递“任务提炼摘要 + 该任务相关的问答”，不全量丢入冗长闲聊，防止上下文溢出。

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 会话模型 `ConversationKind` 扩展支持通用会话类型（`general`），新创建会话默认采用通用会话。
- **FR-002**: 前端移除新建会话时的强制类型选择控件，统一为单输入框的自然交互。
- **FR-003**: 主聊天 Agent（Coordinator）具备意图分析能力，能够准确区分：纯闲聊/设置、生图诉求、位图图标诉求、SVG 图标诉求、取消/跳过指令。
- **FR-004**: 引入结构化子任务模型（SubagentTask），记录任务 ID、所属子 Agent、当前状态（`idle` | `waiting_user` | `ready` | `generating` | `completed` | `failed` | `cancelled`）、待确认问题与建议 Prompt。
- **FR-005**: 将现有的三种 Grill 逻辑（`buildGrillSystemPrompt`、`buildIconGrillSystemPrompt`、`buildSvgGrillSystemPrompt`）解耦封装为独立的专业子 Agent 处理器（Specialist Subagents）。
- **FR-006**: 子 Agent 产生的澄清问题（`clarifyingQuestions`）须通过主 Agent 代理转发给前端，主 Agent 附带引导文案，前端展示所属专家标签。
- **FR-007**: 处于 `waiting_user` 状态时，用户的新回复须优先路由至对应的子 Agent 继续推导，直至达到 `readyToGenerate`。
- **FR-008**: 生成完成的资产须按现有规约保存于对应存储目录（`images/`、`icons/`、`svg/`），资产元数据正确关联至当前会话。
- **FR-009**: 保持对 `specs/001~005` 历史会话数据的完全向下兼容。
- **FR-010**: MCP 直出工具保持不变，继续服务外部 Agent 纯直出场景。

### Key Entities

- **CoordinatorAgent**: 主交互协调者，管理全局对话、意图识别、上下文压缩与子任务生命周期。
- **SpecialistSubagent**: 领域专业子 Agent（Image / Icon / Svg），负责特定资产类型的提示词工程、专业反问与生成就绪判定。
- **SubagentTask**: 子任务实体，包含 `taskId`、`subagentType`、`status`、`clarifyingQuestions`、`suggestedPrompt`、`parameters`、`assetIds`。
- **UnifiedConversation**: 通用会话实体，支持容纳多类型资产与多个子任务的演进历史。

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在同一个会话中，无需手动切换类型，即可通过自然语言分别成功产出高质量图片、位图图标与 SVG 矢量图标。
- **SC-002**: 当子 Agent 提出反向拷问时，主 Agent 100% 能够将问题准确转发给用户，并在用户答复后无缝继续推进。
- **SC-003**: 用户在等待澄清时输入“跳过”，系统 100% 能将跳过指令传达给对应子 Agent 并直接执行生成。
- **SC-004**: 历史已有的单类型会话在升级后能够 100% 正常打开、查看与交互，既有单元测试与 Linter 保持全量通过。
- **SC-005**: 针对普通闲聊输入，主 Agent 的单轮响应延迟相比单 Agent 模式增加不超过 300ms，不产生多余的子 Agent 串行等待。

---

## Assumptions

- 主 Agent 与子 Agent 均复用 Poe.com 的兼容接口（默认模型为 `GPT-4o-Mini`，可配置）。
- MVP 阶段单个子任务的澄清轮次主要聚焦在 1~2 轮，支持快速跳过。
- 复合任务（如同时要图片和图标）按串行依赖方式依次处理。
- 资产库按类型过滤（全部 / 图片 / 位图图标 / SVG）继续生效，通用会话中生成的资产自动归入对应分类。
