# Surreal

AGPL-3.0 开源的自用游戏美术资产生成工作台。通过 Poe API 提供 Web 生图 / 位图图标 / SVG 矢量图标 / **3D 静态网格模型 (.glb)** 专有 Agent，以及 MCP 直出服务。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入 POE_API_KEY（3D Mock 模式无需外部 Key）

pnpm install
pnpm dev
# http://127.0.0.1:3000
```

## 功能

- **统一聊天 Coordinator Agent**：统一会话入口，智能识别意图，自动协同生图、位图图标、SVG 矢量及 **3D 静态模型** 专业子 Agent，中继代理反向拷问与答复闭环
- **3D 静态模型专有 Agent (`ThreeDSpecialist`)**：
  - 几何类别预设（Category Presets）：角色（A/T-Pose 水密网格）、道具（底座对齐与中心原点）、硬表面（倒角与对称）、植被（双面与层叠）
  - 面数与材质反向拷问（Low-Poly 低模 / PBR / 手绘风）
  - 前端 `<model-viewer>` 3D 交互视口（360° 旋转、缩放、Auto-Rotate 与一键下载 `.glb`）
- **可插拔 3D Provider 架构**：
  - `Mock3DProvider`（默认）：零成本离线开箱即用，生成合规 glTF 2.0 Binary 数据
  - `CustomHttp3DProvider`：对接自建独立 Linux GPU 实例或合法远程服务器
- Web **图片 / 位图图标 / SVG / 3D** 专业子 Agent：反向拷问 → 确认后生成
- 资产库按类型过滤（全部 / 图片 / 图标 / SVG / 3D 模型）
- 本地落盘隔离：`data/assets/<conversationId>/{images|icons|svg|models}/…`
- **MCP 服务**：`pnpm mcp`（支持 Cursor、Claude Code 与 Antigravity）
- MCP 会话页：`/mcp-sessions`

活跃规格：`specs/007-3d-model-agent/`

## MCP

项目级配置：[`.cursor/mcp.json`](.cursor/mcp.json)

```bash
pnpm mcp:verify
pnpm mcp:verify-icon
pnpm mcp:verify-svg
pnpm mcp:verify-3d
pnpm mcp:stdio
pnpm mcp
```

工具：`generate_image`、`generate_icon`、`generate_svg_icon`、`generate_3d_model`、`list_image_models`

## 开发

```bash
pnpm lint
pnpm test
pnpm build
```

## 许可

[GNU Affero General Public License v3.0](LICENSE)
