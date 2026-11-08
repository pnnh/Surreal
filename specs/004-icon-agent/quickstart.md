# Quickstart: 004-icon-agent

## Prerequisites

- `.env` 含有效 `POE_API_KEY`
- 接受清空或忽略旧扁平 `data/` 资产
- `pnpm install`

## Web 路径

```bash
pnpm dev
# 打开 http://127.0.0.1:3000
```

1. 新建会话 → 选择 **图标**
2. 发送：「帮我做一个扁平风购物车图标，要透明底」
3. 确认 Agent 反问与建议尺寸列表（可改为例如 16,32,64,128）
4. 点 **立即生成** 或回复确认
5. 会话中应出现多张图标；点收藏
6. 打开资产库 → 类型过滤选 **图标** → 应能看到刚收藏的资产

## 目录检查

生成后确认存在类似路径：

```text
data/assets/<conversationId>/icons/<assetId>.png
```

普通图片会话应对应：

```text
data/assets/<conversationId>/images/<assetId>.png
```

## MCP 路径

确保 [`.cursor/mcp.json`](../../.cursor/mcp.json) 已启用 `surreal-image`，然后调用：

- `generate_icon` — `prompt` + `sizes: [32, 64]`
- 期望返回 `assets` 且 `absolutePath` 指向 `.../icons/...`

```bash
pnpm mcp:verify       # 既有生图
pnpm mcp:verify-icon  # 图标批量
```

升级前可删除旧扁平资产（本 feature 不迁移）：

```bash
rm -rf data/assets data/surreal.sqlite
```

## Contracts

- HTTP：[contracts/icon-agent-api.yaml](./contracts/icon-agent-api.yaml)
- MCP：[contracts/mcp-tools.md](./contracts/mcp-tools.md)
- 数据：[data-model.md](./data-model.md)
