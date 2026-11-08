# Quickstart Validation: 文生图 MVP

用于在 `/speckit-implement` 完成后做端到端验收（对照 [spec.md](./spec.md) 与 [contracts/openapi.yaml](./contracts/openapi.yaml)）。

## Prerequisites

- Node.js 22+
- 有效的 Poe API Key（[poe.com/api/keys](https://poe.com/api/keys)）
- 仓库根目录已实现 Next.js 应用（本文件不包含实现代码）

## Setup

```bash
cp .env.example .env
# 编辑 .env：设置 POE_API_KEY=...
# 可选：SURREAL_DATA_DIR=./data
# 可选：SURREAL_CONTEXT_MESSAGE_LIMIT=6

pnpm install   # 或 npm/yarn，以仓库锁定为准
pnpm dev       # 默认 http://127.0.0.1:3000
```

确认：

```bash
curl -s http://127.0.0.1:3000/api/health
# 期望：{"ok":true,"poeConfigured":true}
```

## Scenario A — 首次出图（P1）

1. 打开对话页，确认模型默认为 `GPT-Image-1.5`（或白名单可选）。
2. 发送提示词，例如：`pixel art goblin character, side view, transparent background`。
3. **期望**：对话中出现助手回复与至少一张图；`data/assets/`（或配置目录）出现文件；`/api/assets` 能列出该项。

## Scenario B — 多轮上下文（P1）

1. 在同一会话继续：`make the goblin wear a red scarf`。
2. **期望**：新消息追加；请求组装含最近 N 轮（默认 6）；新图落盘并关联新消息。

## Scenario C — 全局系统提示词（P2）

1. 打开设置，保存系统提示词：`Always use consistent anime game-asset style, clean lines.`
2. 新开会话再生成。
3. **期望**：后续生成使用新提示词；历史消息内容不被改写。

## Scenario D — 收藏与删除（P2）

1. 在资产库收藏一张图，筛选「仅收藏」可见。
2. 确认删除该图。
3. **期望**：列表消失；磁盘文件移除；刷新后仍不存在。

## Scenario E — 无密钥防护

1. 临时去掉 `POE_API_KEY` 并重启。
2. 尝试生成。
3. **期望**：被阻止并提示配置环境变量；`/api/health` 中 `poeConfigured: false`。

## Contract smoke（可选）

```bash
curl -s http://127.0.0.1:3000/api/models | jq .defaultModel
# 期望：GPT-Image-1.5

curl -s http://127.0.0.1:3000/api/profile | jq .id
# 期望：default
```

## Pass criteria

- Spec 成功标准 SC-001～SC-005 / SC-003a 在本机可演示通过。
- 仓库中无真实 `.env` 或密钥被提交。
