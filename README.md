# Surreal

AGPL-3.0 开源的自用游戏美术资产生成工作台。通过 Poe API 提供 Web 生图/生图标 Agent，以及供其它 Agent 调用的 **MCP 直出图/图标服务**。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入 POE_API_KEY

pnpm install
pnpm dev
# http://127.0.0.1:3000
```

## 功能

- Web **生图 / 生图标** Agent（默认 `GPT-4o-Mini`）：反向拷问 → 确认后生成
- 新建会话可选图片或图标；图标按敲定尺寸批量出位图（PNG/WebP，透明底优先，无 SVG）
- 对话内收藏；资产库按类型过滤（全部 / 图片 / 图标）
- 本地落盘：`data/assets/<conversationId>/{images|icons}/…`（可清空旧扁平 data）
- **MCP**（无反问、无认证 MVP）：`pnpm mcp`
- MCP 会话只读管理页：`/mcp-sessions`

活跃规格：`specs/004-icon-agent/`

## MCP

项目级 Cursor 配置已放在 [`.cursor/mcp.json`](.cursor/mcp.json)（使用 `envFile: .env`，不把密钥写进仓库）。

```bash
# 校验生图链路
pnpm mcp:verify

# 校验生图标链路
pnpm mcp:verify-icon

# 校验 MCP stdio 握手与工具列表
pnpm mcp:stdio

# 手动 stdio 启动（一般由 Cursor 自动拉起，无需常驻）
pnpm mcp
```

工具：

- `generate_image` — 直接按提示词生图并落盘（`images/`）
- `generate_icon` — 按尺寸列表批量生图标并落盘（`icons/`，默认 16/32/64）
- `list_image_models` — 返回生图模型白名单

配置后请在 Cursor Settings → MCP 启用 `surreal-image`，或重载窗口。

> MVP 无认证，仅在本机/受信环境使用。Cursor 会自行 spawn MCP 进程；单独 `pnpm mcp` 常驻通常不需要。

## 开发

```bash
pnpm lint
pnpm test
pnpm build
```

## 许可

[GNU Affero General Public License v3.0](LICENSE)
