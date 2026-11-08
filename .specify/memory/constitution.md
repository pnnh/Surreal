<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Modified principles: placeholders → Surreal-specific principles
- Added sections: Security & Secrets, Development Workflow
- Removed sections: none
- Follow-up TODOs: none
-->
# Surreal Constitution

## Core Principles

### I. 自用优先，MVP 克制
Surreal 首要目标是支撑作者本人开发 2D/3D 游戏时的美术资产生成，而非对标商业 SaaS 的全功能复制。每个阶段 MUST 交付可独立验证的最小价值切片；未经明确规格批准，MUST NOT 提前引入 3D 生成、骨骼动画流水线、多租户或复杂计费。YAGNI：能用本地文件解决的问题，不得为了“以后可能”提前上复杂基础设施。

### II. 密钥与配置隔离（NON-NEGOTIABLE）
第三方密钥（Poe、AWS 等）与运行机密 MUST 仅从环境变量读取。默认 MUST NOT 读写本地配置文件来加载密钥。仓库中 MAY 提供 `.env.example` 这类无密钥模板；真实 `.env`、凭证与本地数据目录 MUST 被 Git 忽略。任何 PR/提交若包含密钥或疑似密钥，MUST 拒绝合并。

### III. 供应商可替换的生成抽象
文生图与后续生成能力 MUST 通过清晰的 Provider 边界对接外部模型服务。MVP 以 Poe OpenAI 兼容 API 为唯一实现；后续本地模型或其它云厂商 MUST 能在不改动核心业务流程的前提下替换。系统提示词与风格约束 MUST 可配置（用户可微调），不得硬编码死在供应商 SDK 调用里。

### IV. 资产持久化可演进
生成结果与收藏元数据 MUST 可持久化。早期 MUST 支持本地文件系统存储；存储接口 MUST 抽象，以便后期接入兼容 AWS S3 API 的对象存储而无需改写业务层。元数据（提示词、模型、时间、收藏状态）MUST 与二进制资产一并可追溯。

### V. 开源与可审计
项目以 AGPL-3.0 开源。网络部署衍生服务 MUST 遵守 AGPL 对源码提供的要求。架构决策、规格与任务 MUST 以 Spec-Kit 产物（`specs/`、`.specify/`）可审计；实现 MUST 可追溯到规格与任务条目。

## Security & Secrets

- `POE_API_KEY`、AWS 凭证等机密仅允许出现在进程环境或密钥管理器中。
- 日志与错误响应 MUST NOT 回显完整密钥；调试输出 MUST 脱敏。
- 早期自用部署可不实现多用户认证，但 MUST 默认仅绑定本机/受信网络，并在规格中明确边界。
- 用户上传与生成内容视为敏感工作资产；本地数据目录权限与备份策略在运维文档中说明。

## Development Workflow

- 遵循 Spec-Kit：`/speckit-constitution` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`（可按需插入 clarify / checklist / analyze / converge）。
- 规划与设计长文放在 `docs/plan/`；功能级规格放在 `specs/`。
- 使用中文撰写面向项目的文档与规格；代码标识符保持英文。
- Agent 集成以 Claude skills（`.claude/skills`）为主；Cursor 可通过读取同一套 Spec-Kit 产物与 `AGENTS.md` 协作。

## Governance

本 Constitution 高于临时约定与口头偏好。修订 MUST：
1. 更新本文件并递增语义化版本（MAJOR：原则删除/不兼容重定义；MINOR：新增或实质扩展原则；PATCH：措辞澄清）。
2. 同步评估进行中的 `specs/` 是否需澄清或返工。
3. 在变更说明中记录理由与影响面。

实现与评审 MUST 核对：密钥隔离、MVP 范围克制、Provider/存储抽象是否被破坏。复杂性引入 MUST 有规格依据。

**Version**: 1.0.0 | **Ratified**: 2026-11-08 | **Last Amended**: 2026-11-08
