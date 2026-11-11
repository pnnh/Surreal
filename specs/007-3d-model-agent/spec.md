# Feature Specification: 3D 静态模型生成专有 Agent 与可插拔 Provider 架构

**Feature Branch**: `007-3d-model-agent`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "实现专门生成 3D 静态模型的专有 Agent，配合主聊天 Agent 协同。支持类别预设（角色、道具、植被、硬表面等），并通过合规且可插拔的 3D Provider 架构（默认内置 Mock 零成本测试、支持自建 GPU 实例、Serverless API 与 Hugging Face Spaces）完成 .glb 模型生成、落盘、三维实时交互预览与 MCP 工具支持。"

---

## 需求背景与设计理念

在 Feature 006 中，Surreal 成功演进为 **Coordinator-Subagent（主协调者-专业子 Agent）** 的中心协同架构，已经支持了图片、位图图标、SVG 矢量图标三大资产专业分支。

游戏美术工作流中，**3D 静态网格资产（Static Mesh / Props / Characters）** 是核心需求。由于 3D 生成模型（如 Microsoft TRELLIS、Tencent Hunyuan3D-2）对深度学习算子（CUDA C++ 扩展）和高端 NVIDIA GPU 依赖极高，在普通开发机（如 Apple Silicon Mac）上直接运行存在算力壁垒。同时，将无头后台服务部署于免费计算平台（如 Google Colab）进行公网穿透存在违反平台服务条款的风险。

本特性旨在为 Surreal 引入第四位领域专家 —— **3D 模型专家 Agent（`ThreeDSpecialist`）**，并建立合规、安全、解耦的 **可插拔 3D 引擎服务架构（`ThreeDProvider`）**：
1. **单一 Agent + 类别预设（Category Presets）**：避免为角色、道具、树木创建过多割裂的 Agent，而是在 `ThreeDSpecialist` 内置针对游戏资产分类的拓扑与姿态先验（如角色的 A/T-Pose 与水密网格、硬表面的平直倒角与轴对称、植被的双面材质与层叠遮罩、通用道具的底座对齐与中心原点）。
2. **专业 3D 反向拷问（3D Grill HITL）**：主 Agent 代为向用户提问关于模型风格（Low-Poly 低模 / PBR 次时代 / 手绘风）、面数预算、UV 贴图与对齐基准。
3. **合规可插拔 Provider 适配器架构**：
   - `Mock3DProvider`（默认激活）：内置标准合规的立方体/宝箱 `.glb` 二进制模型，实现**零成本、零密钥、离线全链路可用**，保证自动化测试与本地开发永远可用。
   - `CustomHttp3DProvider`：支持标准的 HTTP API 协议，连接自建 GPU 服务器（如本地独立 Linux 工作站、AutoDL、RunPod 等独立云服务器）。
   - `FalAi3DProvider` / `Tripo3DProvider`（可选预留）：支持无服务器云端按需推理（Serverless API）。
   - `GradioSpace3DProvider`（可选预留）：通过官方 `@gradio/client` 接入 Hugging Face Spaces 托管的合规公有/私有 Space。
4. **全套配套体验**：
   - 本地资产存储：规范落盘为标准的 `.glb` 文件（Binary glTF），存储于 `data/assets/<convId>/models/<id>.glb`。
   - 前端 3D 交互卡片：基于 Google `<model-viewer>` 实现 3D 轨道相机旋转、缩放、视角重置、自动旋转开关与一键下载。
   - 资产库集成：资产管理面板支持筛选 `3D 模型 (model)`，支持缩略卡片与 3D 弹窗交互查看。
   - MCP 服务扩展：暴露 `generate_3d_model` 工具供外部 Agent 直接生成 3D 资产。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 主 Agent 自动识别 3D 诉求并派发至 3D 专家 (Priority: P1)

用户在主聊天界面输入制作三维模型的需求（如“帮我做一个低多边形的木质宝箱 3D 模型”或“生成一个写实风格的骑士立像 3D mesh”）。主协调 Agent 准确识别出 `model`（3D 模型）意图，初始化 3D 子任务并指派给 `ThreeDSpecialist`。

**Why this priority**: 核心路由与协同入口，保持统一会话的用户体验。

**Independent Test**: 在主聊天窗口输入“给我做一个中世纪石制水井的 3D 模型”，系统返回 3D 专家专属的澄清问题，任务状态显示为 3D 模型细化中。

**Acceptance Scenarios**:

1. **Given** 统一聊天会话，**When** 用户提出包含“3D 模型”、“三维”、“glb”、“mesh”、“low-poly 模型”等意图的请求，**Then** 主 Agent 将任务类型识别为 `model`（或 `3d`）并派发给 `ThreeDSpecialist`。
2. **Given** 3D 专家接单，**When** 需求参数有待明确，**Then** 3D 专家提出 2~3 个关键的三维生成问题（面数风格、底座对齐、纹理类型），由主 Agent 代为提问。

---

### User Story 2 - 3D 领域级反向拷问（Grill）与资产类别先验 (Priority: P1)

`ThreeDSpecialist` 根据用户描述自动匹配或询问资产类别预设：
- **角色/生物 (Character)**：强调水密性 (Manifold)、A/T-Pose 站姿、面部与肢体朝向 (+Z)。
- **道具/装备 (Prop)**：强调底座对齐 (Origin at base)、握持点、缩放尺度。
- **硬表面/建筑 (Hard Surface)**：强调平直边缘、对称性。
- **植被/自然物 (Foliage)**：强调簇状分布、有机形变。
用户回答或点击“快速生成”后，3D 专家将参数结构化并标记 `readyToGenerate=true`。

**Why this priority**: 3D 生成对几何先验（拓扑与姿态）极其敏感，优质的 Grill 提示词直接决定模型能否用于游戏引擎（Godot/Unity/Unreal）。

**Independent Test**: 用户回复澄清“低模手绘风，做成游戏道具，中心在底部” → 3D 专家吸收参数并准备生成。

**Acceptance Scenarios**:

1. **Given** 用户描述“生成一个精灵战士 3D 模型”，**When** 3D 专家分析，**Then** 自动注入角色类别的 A-Pose 与水密性先验约束。
2. **Given** 用户点击“跳过澄清 / 立即生成”，**When** 3D 专家处理，**Then** 使用默认的 Low-Poly 道具预设推进生成。

---

### User Story 3 - 可插拔 3D Provider 与模型落盘 (Priority: P1)

系统根据环境变量 `THREE_D_PROVIDER` 调用底层生成引擎：
- 默认未配置时使用 `Mock3DProvider`，零依赖返回标准合规的 `.glb` 二进制模型；
- 配置为 `custom_http` 时，调用 `THREE_D_API_URL` 提供的端点，传输生成提示词或参考图，接收生成的 `.glb` 文件流；
- 生成的 `.glb` 文件持久化保存至 `data/assets/<convId>/models/<filename>.glb`，数据库中生成一条 `asset_type = 'model'` 的记录。

**Why this priority**: 核心资产产出链路，必须与外部环境彻底解耦，无论用户是否有 GPU 都能保证系统健壮可用。

**Independent Test**: 配置默认 `THREE_D_PROVIDER=mock`，触发生成 → `data/assets/.../models/` 成功创建有效 `.glb` 文件 → 数据库新增 model 类型资产。

**Acceptance Scenarios**:

1. **Given** 3D 任务标记为 `readyToGenerate`，**When** 执行生成逻辑，**Then** 3D 适配器根据配置调用对应的 Provider 产出 `.glb`。
2. **Given** `.glb` 生成成功，**When** 落盘入库，**Then** 资产文件存入对应会话的 `models` 子目录，并在 `assets` 表中登记。
3. **Given** 远端 HTTP 接口不可达或超时，**When** 发生网络异常，**Then** 优雅捕获错误并由主 Agent 提示用户检查连接，不导致前端崩溃。

---

### User Story 4 - 前端实时 3D 模型交互式预览组件 (Priority: P1)

主聊天会话与资产库支持 3D 模型的高保真交互预览：
- 集成 Google `<model-viewer>`（Web Component 惰性加载）。
- 支持鼠标/手势 **360° 旋转轨道、视角俯仰、滚轮平移缩放**。
- 支持 **自动旋转（Auto-Rotate 开关）**、**视角重置**。
- 提供 **下载 `.glb`** 与 **一键收藏** 按钮。

**Why this priority**: 3D 资产的即时可视化验证是游戏开发者的刚需，直观看到模型拓扑、光影和质感。

**Independent Test**: 生成完成后，消息卡片内直接出现 3D 视口，用户拖动鼠标可自由旋转模型查看背部结构，点击下载可获取可导入 Blender 的 `.glb`。

**Acceptance Scenarios**:

1. **Given** 消息中包含 3D 资产，**When** 渲染消息卡片，**Then** 显示 `<model-viewer>` 交互视口而非纯静态图片。
2. **Given** 用户拖动 3D 视口，**When** 交互操作，**Then** 模型响应平滑旋转与缩放。
3. **Given** 用户点击下载，**When** 触发操作，**Then** 浏览器下载对应的 `.glb` 二进制文件。

---

### User Story 5 - 资产库 3D 模型分类与管理 (Priority: P2)

资产库（Asset Drawer / Gallery）支持按 `model` 类型筛选：
- 筛选器增加“3D 模型”标签项。
- 3D 资产以专属模型卡片展示，点击可在模态框中打开 3D 交互视口查看详情与元数据（面数、创建时间、所属会话）。

**Why this priority**: 完善资产管理的一致性体验。

**Independent Test**: 点击顶部“资产库” → 切换到“3D 模型”标签 → 仅展示已生成的 3D 模型，点击卡片可 3D 旋转预览。

**Acceptance Scenarios**:

1. **Given** 资产库中存在多种类型资产，**When** 用户点击“3D 模型”过滤标签，**Then** 列表仅保留 `asset_type = 'model'` 的项目。
2. **Given** 用户点击某 3D 资产，**When** 弹出详情，**Then** 在模态框中完整渲染 `<model-viewer>` 交互视口。

---

### User Story 6 - MCP 协议扩展 `generate_3d_model` (Priority: P2)

Surreal 的 MCP 服务器扩展 3D 工具：
- 工具名：`generate_3d_model`
- 参数：`prompt` (必填), `category` (可选: `character` | `prop` | `hard_surface` | `foliage`), `style` (可选: `low-poly` | `pbr` | `stylized`), `conversation_id` (可选)。
- 输出：生成的 `.glb` 文件绝对路径与资产 ID。

**Why this priority**: 赋能外部 Agent（如 Cursor, Antigravity, Claude Code）通过 MCP 工具直接调用 3D 资产生成流水线。

**Independent Test**: 调用 `mcp.call_tool("generate_3d_model", { prompt: "wooden barrel" })`，返回有效 `.glb` 本地路径。

**Acceptance Scenarios**:

1. **Given** MCP 服务运行，**When** 外部客户端请求工具列表，**Then** 包含 `generate_3d_model` 及其详细 JSON Schema。
2. **Given** 调用 `generate_3d_model`，**When** 执行完毕，**Then** 资产成功存盘并返回路径。

---

## Edge Cases

- **非法的 3D 资产格式**：如果远端服务意外返回报错 HTML 或损坏的 glb，校验 glb 头（`glTF` 魔数 `0x46546C67`），防止损坏文件写入磁盘。
- **并发请求与生成耗时**：3D 生成耗时可能达 20~60 秒，HTTP Client 需配置合理的超时时间（建议 180s），并在前端提供清晰的“正在构建 3D 几何与纹理…”状态。
- **WebGL 2.0 不可用降级**：若用户设备或环境无法启动 WebGL，`<model-viewer>` 优雅降级展示下载按钮与备用图标。

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 数据库 `AssetType` 与 `ConversationKind` 扩展支持 `"model"`。
- **FR-002**: `SubagentType` 扩展支持 `"3d"`（别名 `"model"`）。
- **FR-003**: Coordinator 意图识别 Prompt 与启发式路由支持 3D 模型创作识别。
- **FR-004**: 实现 `ThreeDSpecialist` 类，具备 3D 领域反向拷问（Grill）与类别预设支持。
- **FR-005**: 实现 `ThreeDProvider` 接口及其实现类 `Mock3DProvider` 与 `CustomHttp3DProvider`。
- **FR-006**: 3D 生成流水线落盘至 `data/assets/<convId>/models/<id>.glb`。
- **FR-007**: 前端集成 `<model-viewer>`，提供 3D 资产实时交互旋转、缩放与下载。
- **FR-008**: 资产库支持按 `3D 模型 (model)` 进行分类筛选与展示。
- **FR-009**: MCP 服务器暴露 `generate_3d_model` 工具。

---

## Non-Functional Requirements

- **NR-001 (安全与私密性)**：API URL 与密钥仅读取环境变量（`THREE_D_API_URL`、`THREE_D_API_KEY`、`FAL_KEY`），禁止硬编码。
- **NR-002 (离线可用性)**：默认使用 `Mock3DProvider`，保证测试套件与离线开发 100% 通过。
- **NR-003 (性能与体积)**：`<model-viewer>` 脚本采用客户端按需注入加载，不影响首屏打包体积。
- **NR-004 (跨平台兼容)**：产出的 `.glb` 符合 glTF 2.0 规范，可直接导入 Blender、Unity、Unreal Engine 或 Godot。
