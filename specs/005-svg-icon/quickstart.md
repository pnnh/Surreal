# Quickstart: 005-svg-icon

## Prerequisites

- `.env` 含有效 `POE_API_KEY`
- `pnpm install` / `pnpm dev`

## Web 路径

1. 新建会话 → 选择 **SVG**
2. 发送：「做一个可换色的扁平购物车图标」
3. 确认 Agent 澄清后点 **立即生成**（或跳过澄清）
4. 聊天预览中调整颜色/尺寸控件，确认 CSS 生效
5. 收藏 → 资产库类型选 **SVG** 可见

## 目录检查

```text
data/assets/<conversationId>/svg/<assetId>.svg
```

打开文件应含 `viewBox` 与 `currentColor`（或规格等价约定）。

## MCP

```bash
pnpm mcp:verify-svg   # 实现阶段新增
# 或在 Cursor 中调用 generate_svg_icon
```

期望返回 `absolutePath` 指向 `.svg` 且文件存在。

## Contracts

- HTTP：[contracts/svg-agent-api.yaml](./contracts/svg-agent-api.yaml)
- MCP：[contracts/mcp-tools.md](./contracts/mcp-tools.md)
- 数据：[data-model.md](./data-model.md)
