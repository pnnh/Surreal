# Feature Specification: SVG 矢量图标 Agent

**Feature Branch**: `005-svg-icon`

**Created**: 2026-11-08

**Status**: Clarified

**Input**: User description: "实现此前搁置的 SVG 图标生成。SVG 为矢量图标；对话 Agent 多轮澄清后一次性生成；系统提示词须要求支持通过 CSS 调整大小与颜色。复用既有会话分流、收藏、资产库类型过滤与按会话落盘约定；同步 MCP。"

## Clarifications

### Session 2026-11-08（承接 004）

- 004 明确位图图标优先、SVG 后置；本 feature 交付 SVG 矢量路径。
- 矢量单文件即可通过 CSS 缩放，**不**再按多像素档批量出多份 SVG（与位图图标多尺寸策略区分）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 新建会话选择 SVG 图标 (Priority: P1)

开发者新建对话时可选择 **SVG 图标**（与普通图片、位图图标并列）。该会话走矢量图标澄清与生成语义，不与位图图标批量尺寸逻辑混用。

**Why this priority**: 入口分流是 Agent 与存储分类的前提。

**Independent Test**: 新建「SVG」会话 → 列表/详情可识别 → 模糊需求进入 SVG 澄清话术。

**Acceptance Scenarios**:

1. **Given** 用户新建会话，**When** 选择 SVG 图标，**Then** 会话标记为 SVG 类型，UI 呈现矢量图标工作流（跳过澄清 / 立即生成）。
2. **Given** 用户选择普通图片或位图图标，**When** 使用既有流程，**Then** 行为不被 SVG 逻辑破坏。
3. **Given** 已有 SVG 会话，**When** 重新打开，**Then** 仍按 SVG 类型加载，不可静默改成其它类型。

---

### User Story 2 - SVG Agent 澄清后生成可 CSS 着色/缩放的矢量 (Priority: P1)

用户描述想要的矢量图标。文本 Agent 反向拷问（风格、用途、是否单色、细节等），给出建议描述。用户确认或跳过后，系统**一次性**生成一份 SVG 源码并落盘、在对话中预览。

生成物 MUST 适合用 CSS 控制大小与颜色：例如具备合适 `viewBox`、默认使用 `currentColor`（或等价可继承色），避免写死无法覆盖的填充/描边色与固定像素宽高阻碍缩放。

**Why this priority**: 核心价值；无 CSS 可控性则与「矢量图标」目标不符。

**Independent Test**: 「做一个可换色的购物车 SVG」→ 反问 → 确认 → 得到 `.svg`；预览区用 CSS 改 `color`/`width` 可见变化（或等价检查源码约束）。

**Acceptance Scenarios**:

1. **Given** 模糊 SVG 需求，**When** Agent 回复，**Then** 含约 2–4 个澄清点与建议描述，且尚未写出/落盘 SVG。
2. **Given** 用户确认生成，**When** 完成，**Then** 会话中出现可预览的 SVG 资产，文件为矢量源码（非位图）。
3. **Given** 已生成的 SVG，**When** 检查源码或预览控件，**Then** 可通过 CSS（如 `color`、`width`/`height`/`font-size` 作用于 `currentColor` 图标）调整颜色与显示尺寸，而无需重新生成多档文件。
4. **Given** 用户跳过澄清，**When** 系统处理，**Then** 基于已知信息生成一份 SVG，并列出假设。

---

### User Story 3 - 收藏与资产库类型过滤含 SVG (Priority: P1)

SVG 资产可在对话中收藏。资产库类型过滤至少支持：全部 / 图片 / 位图图标 / SVG（或等价清晰分类），便于只浏览矢量图标。

**Why this priority**: 与图片、位图图标并存后需可管理。

**Independent Test**: 收藏 SVG → 资产库选 SVG 类型可见；选图片/位图图标不可见该条。

**Acceptance Scenarios**:

1. **Given** 会话中已生成 SVG，**When** 点击收藏，**Then** 资产标记收藏且类型为 SVG。
2. **Given** 库中有多类型资产，**When** 过滤 SVG，**Then** 仅显示 SVG。
3. **Given** 选「全部」，**When** 浏览，**Then** 三类均可出现并带类型标识。

---

### User Story 4 - 按会话落盘 SVG (Priority: P2)

SVG 文件落在会话子目录的矢量专用路径（与 `images/`、位图 `icons/` 区分），元数据可追溯提示词与模型。

**Why this priority**: 延续 004 目录约定，便于清理与区分。

**Independent Test**: 生成后磁盘出现 `…/<conversationId>/svg/….svg`（或规格锁定的等价路径）。

**Acceptance Scenarios**:

1. **Given** SVG 会话生成成功，**When** 检查本地数据目录，**Then** 文件位于该会话的 SVG 子目录。
2. **Given** 提供下载/打开文件，**When** 用户获取，**Then** 得到合法 SVG 文本文件。

---

### User Story 5 - MCP 直出 SVG 图标 (Priority: P2)

外部 Agent 可通过 MCP 调用（如 `generate_svg_icon`）：传入提示词（及可选模型），**无反问**，直接生成并落盘，归属 MCP 会话，资产类型为 SVG，且满足 CSS 可调大小/颜色的源码约定。

**Why this priority**: 与既有 MCP 生图/位图图标对称。

**Independent Test**: 仅调 MCP → 返回路径指向 `.svg` 且源码含 `viewBox` 与 `currentColor`（或文档等价约定）。

**Acceptance Scenarios**:

1. **Given** MCP 已配置，**When** 调用直出工具，**Then** 不经澄清环生成 SVG 并落盘。
2. **Given** 调用成功，**When** 查看元数据，**Then** 会话为 MCP 来源，资产类型为 SVG。
3. **Given** 缺密钥或空提示词，**When** 调用，**Then** 可读错误，无误导性成功。

---

### Edge Cases

- 模型返回非 SVG / 夹杂 Markdown 围栏：系统应剥离围栏并校验根元素；失败则可读错误，不落盘伪造成功。
- 含脚本、外部资源引用或明显不安全内容：拒绝落盘或剥离危险部分（至少禁止 `<script>` 与外部 URL 资源）。
- 用户要求多色复杂插画：Agent 可澄清「单色 CSS 着色」与「多色固定色」的取舍；默认倾向单色 `currentColor` 图标；若用户坚持多色，仍须可缩放（`viewBox`），颜色 CSS 覆盖能力可减弱并在假设中说明。
- 未配置文本模型密钥：阻止 Agent 与生成，提示配置。
- 同会话并发生成：串行或拒绝第二请求。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 新建会话 MUST 支持选择用途：`image` | `icon`（位图）| `svg`（矢量）；选择 MUST 持久化且创建后不可变（MVP）。
- **FR-002**: `svg` 会话中用户消息 MUST 先由文本 SVG Agent 处理；确认或显式跳过前 MUST NOT 落盘 SVG。
- **FR-003**: SVG Agent 每轮澄清约 2–4 点，SHOULD 附带建议描述；门闩交互对齐既有「跳过澄清」「立即生成」。
- **FR-004**: 确认后 MUST 一次性生成**一份** SVG 源码资产（非多尺寸位图批量）。
- **FR-005**: 系统提示词与生成约束 MUST 要求输出适合 CSS 控制大小与颜色：至少包含可用的 `viewBox`；主色 SHOULD 使用 `currentColor`（或文档等价机制）；MUST NOT 依赖仅固定 `width`/`height` 像素且无法用 CSS 放大的写法作为唯一尺寸手段。
- **FR-006**: 落盘前 MUST 做基本合法性校验（可解析为 SVG）；MUST 拒绝或清除明显危险内容（如脚本）。
- **FR-007**: 对话预览 MUST 支持收藏；资产类型 MUST 区分 SVG，资产库 MUST 可按类型过滤（含 SVG）。
- **FR-008**: 本地路径 MUST 按会话组织并单独存放 SVG（建议 `…/<conversationId>/svg/`）。
- **FR-009**: 默认文本模型策略与既有 Agent 一致（可环境变量覆盖）；SVG 由文本模型产出源码，MUST NOT 依赖位图生图模型把栅格当矢量。
- **FR-010**: MCP MUST 提供直出 SVG 工具（建议名 `generate_svg_icon`），无反问，参数至少含提示词与可选模型。
- **FR-011**: 密钥仍 MUST 仅从环境变量读取；错误 MUST NOT 回显密钥。
- **FR-012**: MVP MUST NOT 引入多用户认证、3D/骨骼、S3 上线，或把 SVG 栅格化成唯一交付形态。

### Key Entities

- **ConversationKind**: 扩展为 `image` | `icon` | `svg`。
- **AssetType**: 扩展为 `image` | `icon` | `svg`。
- **SvgIconSpec**: 建议描述、单色/多色偏好、CSS 着色约定、可选风格备注。
- **SvgArtifact**: 校验后的 SVG 文本、mime `image/svg+xml`、存储键、可选预览元数据。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: SVG 会话在确认/跳过前 100% 不落盘 SVG 文件（模糊提示自测路径）。
- **SC-002**: 用户可在 5 分钟内完成「选 SVG 会话 → 澄清 → 确认 → 看到矢量预览」演示（密钥有效时）。
- **SC-003**: 抽查生成的 SVG，≥90% 含 `viewBox`，且主路径使用 `currentColor` 或规格记载的等价 CSS 着色约定（作者抽查 ≥10 份）。
- **SC-004**: 资产库 SVG 过滤与收藏组合可定位刚生成资产。
- **SC-005**: MCP 直出在 2 分钟内返回存在的 `.svg` 文件路径。
- **SC-006**: 在预览或检查器中改变 CSS `color`/`width` 后，图标外观相应变化（单色约定下），无需重新生成。

## Assumptions

- 复用 002/004 的门闩对话模式与 Poe 文本模型；SVG 不走 ImageProvider 栅格管线。
- 会话第三选项文案可为「SVG」/「矢量图标」；位图图标仍称「图标」。
- 默认产出单色、`currentColor` 图标；多色为进阶且须在假设中标明 CSS 换色能力受限。
- 安全策略为轻量静态检查（禁止 script、javascript: URL 等），非完整 SVG 沙箱产品化。
- MCP 与 Web 共用校验与落盘逻辑。
- 中英 UI 补齐 SVG 相关文案。
- 不要求一次生成多份不同 viewBox 的 SVG 文件。
