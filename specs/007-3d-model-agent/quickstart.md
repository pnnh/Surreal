# Quickstart: 3D 静态模型生成体验指南

**Feature**: 007-3d-model-agent
**Date**: 2026-11-11

---

## 1. 快速上手（默认 Mock 模式，零成本开箱即用）

无需配置任何 API Key 或 GPU 服务器，代码库默认启用 `Mock3DProvider`：

1. **启动开发服务**：
   ```bash
   pnpm dev
   ```
2. **访问应用**：
   在浏览器中打开 `http://localhost:3000`。
3. **在统一对话中输入 3D 需求**：
   > “帮我做一个中世纪木桶的 3D 模型”
4. **体验 3D 反向拷问与生成**：
   - 系统将显示“3D 模型专家细化中”；
   - 3D 专家提出面数风格与底座对齐问题；
   - 此时点击“立即生成”或回复“低多边形手绘风”；
   - 消息卡片直接呈现 **3D 交互式模型视口**！
5. **在视口中操作**：
   - 鼠标左键拖拽：360° 旋转观察模型；
   - 鼠标滚轮：缩放；
   - 点击“下载 .glb”：下载符合 glTF 2.0 规范的真实模型文件。

---

## 2. 接入真实 GPU 服务器 (`custom_http`)

如果您拥有本地独立的 Linux GPU 工作站，或在 AutoDL / RunPod 等云算力平台部署了 Trellis / Hunyuan3D-2 服务：

在 `.env.local` 中配置：
```env
THREE_D_PROVIDER=custom_http
THREE_D_API_URL=http://your-gpu-server-ip:8000
# 如果有密钥鉴权
THREE_D_API_KEY=your_secret_token
```

Surreal 会将 3D 生成请求转发至该端点的 `POST /generate`。

---

## 3. 通过 MCP 工具调用 3D 生成

在支持 MCP 的智能体（Cursor / Antigravity / Claude Code）中，直接调用工具：

```json
{
  "name": "generate_3d_model",
  "arguments": {
    "prompt": "stylized treasure chest with gold trim",
    "category": "prop",
    "style": "low-poly"
  }
}
```

返回生成的 `.glb` 文件绝对路径及资产详情。

