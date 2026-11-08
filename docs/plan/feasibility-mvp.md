# Surreal 可行性分析与 MVP 边界

**日期**: 2026-11-08  
**结论**: **可行**。以 Poe OpenAI 兼容 API + 本地存储做「文生图对话 + 资产收藏」MVP，风险可控、路径清晰；完整对标 Ludo.ai（3D/骨骼/场景管线）应分阶段，不可作为第一里程碑。

## 1. 动机对照

| 痛点（相对 Ludo.ai 类产品） | Surreal 应对 |
| --- | --- |
| 订阅贵、能力锁定 | 自建薄封装，按需调用已有 Poe 点数 |
| 难接第三方/本地模型 | Provider 抽象，MVP 只接 Poe，后续可扩 |
| 系统提示词不可调 | MVP 起支持可编辑系统提示词/风格预设 |
| 资产难沉淀到工作流 | 本地（后 S3）持久化 + 收藏与元数据 |

## 2. 技术可行性

### 2.1 Poe API（文生图）

- Poe 提供 OpenAI 兼容端点：`https://api.poe.com/v1`，可用官方 `openai` SDK，仅改 `base_url` 与 `POE_API_KEY`。
- 图像类 bot（如 `GPT-Image-1.5` 等）建议 `stream=false`；响应中带生成媒体附件/URL，后端下载后写入本地存储。
- 已知限制（需在产品层消化）：
  - OpenAI 兼容层对部分自定义参数（如 aspect ratio）支持不完整；精细控制可能需 Poe 原生库或后续 Provider。
  - 仅公开 bot；点数消耗依赖 Poe 订阅/余额。
  - CDN 图片 URL 可能有时效；**生成后必须落盘**，不能只存外链。

**判定**: MVP 文生图 **可行**。

### 2.2 对话界面 + 收藏

- 标准 Chat UI + 消息中的图片气泡；收藏为元数据标记 + 资产库视图。
- 无多租户时可用单用户本地元数据（SQLite/JSON）即可。

**判定**: **可行且应做为 P0**。

### 2.3 存储演进

- 抽象 `StorageBackend`：`LocalFs` → `S3Compatible`。
- 密钥全部环境变量：`POE_API_KEY`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`S3_BUCKET`、`S3_ENDPOINT` 等。

**判定**: **可行**；S3 放入后续规格，不阻塞 MVP。

### 2.4 中长期（2D/3D/骨骼动画）

| 能力 | 难度 | 说明 |
| --- | --- | --- |
| 文生图 / 图生图 | 低 | Poe 多模型可覆盖 |
| 风格一致角色表 | 中 | 依赖提示词工程 + 参考图 + 后期可微调/IP-Adapter 类能力 |
| 3D 网格生成 | 高 | 需独立模型/管线（Meshy、Tripo 等），非 Poe 一键可得 |
| 骨骼/动画 | 很高 | 需绑定与动画工具链，远超「对话包一层 API」 |

**判定**: 愿景合理，但 **不得与 MVP 混做**；每类能力单独 Spec 切片。

## 3. 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Poe 媒体返回格式因模型而异 | 解析失败 | 先锁定 1–2 个图像 bot；写适配器与回归样例 |
| 外链过期 | 资产丢失 | 生成后立即下载落盘 |
| 密钥泄漏 | 账号/费用损失 | 仅环境变量；`.gitignore`；无密钥进仓 |
| 范围蔓延到 3D | 延期 | Constitution + Spec 门禁 |
| AGPL 对托管衍生服务的义务 | 分发约束 | 自用无碍；若对外 SaaS 需合规提供源码 |

## 4. MVP 范围（In / Out）

**In**

- 文生图对话（选模型、发提示词、看图、多轮）
- 可编辑系统提示词（全局或会话级）
- 生图结果本地保存 + 元数据
- 资产库浏览与收藏/取消收藏
- 环境变量配置 Poe

**Out（明确延期）**

- 3D / 骨骼 / 视频生成产品化
- 多用户账号体系与权限
- S3 实际上线（仅预留接口形状）
- 计费、团队协作、插件市场

## 5. 建议技术栈（供 `/speckit-plan` 确认）

推荐默认（可在 plan 阶段调整）：

- **前端**: Next.js（App Router）+ 简洁对话/画廊 UI
- **后端**: 同仓 Route Handlers 或独立 FastAPI；统一通过 OpenAI SDK 调 Poe
- **元数据**: SQLite
- **文件**: `./data/assets`（可配置路径，Git 忽略）

## 6. 下一步（Spec-Kit）

1. ✅ `specify init`（Claude skills）
2. ✅ Constitution `1.0.0`
3. ✅ MVP Spec：`specs/001-text-to-image-mvp`
4. 下一命令：`/speckit-plan`（确认技术栈与架构）
5. 然后：`/speckit-tasks` → `/speckit-implement`
