# Surreal

AGPL-3.0 开源的自用游戏美术资产生成工作台。通过 Poe API 提供**轻量生图 Agent**：先反向拷问澄清意图，确认后再调用生图模型。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入 POE_API_KEY

pnpm install
pnpm dev
# http://127.0.0.1:3000
```

## 功能

- 生图 Agent（默认 `GPT-4o-Mini`）：多轮澄清 + 建议提示词
- 「立即生成」确认门闩；「跳过澄清」按钮 / 自然语言强制出图
- 生图模型白名单（默认 `GPT-Image-1.5`）与本地资产库（收藏/删除）
- 中英 UI（浏览器语言检测，默认英语）

活跃规格：`specs/002-image-agent-grill/`

## 开发

```bash
pnpm lint
pnpm test
pnpm build
```

## 许可

[GNU Affero General Public License v3.0](LICENSE)
