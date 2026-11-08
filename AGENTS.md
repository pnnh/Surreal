# 基本规则

使用中文回复和输出项目文档。代码标识符与 API 字段使用英文。

# 规划与设计文档说明

- 规划/设计长文：`docs/plan/`
- 功能规格与任务：`specs/`
- 项目原则：`.specify/memory/constitution.md`

# 关于源码提交

禁止把任何环境变量配置和安全密钥放在 Git 仓库中。本地配置必须加入 Git 忽略列表。密钥 **仅** 从环境变量读取，默认不通过配置文件加载密钥。

# 项目技术栈与工程约定

**Spec-Driven Development (Spec-Kit) 流程**：

- 规范与任务驱动：`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`（可插入 clarify / checklist / analyze / converge）
- 规范存储：`.specify/` 与 `specs/`
- Agent skills：`.claude/skills/speckit-*`（Claude 格式；Cursor 等 Agent 可读同一产物）

**产品边界（摘要）**：

- Surreal：自用游戏美术资产生成工作台（AGPL-3.0）
- MVP：Poe 文生图对话 + 本地资产存储/收藏 + 可调系统提示词
- 非 MVP：3D/骨骼产品化、多用户、S3 上线（仅预留抽象）

**当前活动功能**：见 `.specify/feature.json` → `specs/002-image-agent-grill/`（轻量生图 Agent / 反向拷问）

**已完成基线**：`specs/001-text-to-image-mvp/`（文生图对话 + 资产库 MVP）
