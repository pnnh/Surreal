# Surreal

AGPL-3.0 开源的自用游戏美术资产生成工作台。通过 Poe API 提供 Web 生图 Agent，以及供其它 Agent 调用的 **MCP 直出图服务**。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入 POE_API_KEY

pnpm install
pnpm dev
# http://127.0.0.1:3000
```

## 功能

- Web 生图 Agent（默认 `GPT-4o-Mini`）：反向拷问 → 确认后生图
- 对话内图片右下角收藏；资产库浏览/筛选/删除
- **MCP**（无反问、无认证 MVP）：`pnpm mcp`
- MCP 会话只读管理页：`/mcp-sessions`

活跃规格：`specs/003-mcp-image-service/`

## MCP

```bash
pnpm mcp
```

工具：

- `generate_image` — 直接按提示词生图并落盘（创建 `source=mcp` 会话）
- `list_image_models` — 返回生图模型白名单

Cursor / Claude Desktop 示例配置：

```json
{
  "mcpServers": {
    "surreal-image": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "/absolute/path/to/Surreal",
      "env": {
        "POE_API_KEY": "your-key"
      }
    }
  }
}
```

> MVP 无认证，仅在本机/受信环境使用。

## 开发

```bash
pnpm lint
pnpm test
pnpm build
```

## 许可

[GNU Affero General Public License v3.0](LICENSE)
