# Surreal

AGPL-3.0 开源的自用游戏美术资产生成工作台。通过 Poe API 提供 Web 生图 / 位图图标 / **SVG 矢量图标** Agent，以及 MCP 直出服务。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入 POE_API_KEY

pnpm install
pnpm dev
# http://127.0.0.1:3000
```

## 功能

- Web **图片 / 位图图标 / SVG** Agent（默认文本 `GPT-4o-Mini`）：反向拷问 → 确认后生成
- SVG：单份矢量，`viewBox` + `currentColor`，可用 CSS 调大小与颜色
- 资产库按类型过滤（全部 / 图片 / 图标 / SVG）
- 落盘：`data/assets/<conversationId>/{images|icons|svg}/…`
- **MCP**（无反问、无认证 MVP）：`pnpm mcp`
- MCP 会话页：`/mcp-sessions`

活跃规格：`specs/005-svg-icon/`

## MCP

项目级配置：[`.cursor/mcp.json`](.cursor/mcp.json)

```bash
pnpm mcp:verify
pnpm mcp:verify-icon
pnpm mcp:verify-svg
pnpm mcp:stdio
pnpm mcp
```

工具：`generate_image`、`generate_icon`、`generate_svg_icon`、`list_image_models`

## 开发

```bash
pnpm lint
pnpm test
pnpm build
```

## 许可

[GNU Affero General Public License v3.0](LICENSE)
