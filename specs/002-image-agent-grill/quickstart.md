# Quickstart Validation: 轻量生图 Agent

## Prerequisites

- `POE_API_KEY` 已配置
- `pnpm dev` → http://127.0.0.1:3000
- 可选：`SURREAL_AGENT_MODEL=GPT-4o-Mini`

## Scenario A — 模糊需求必须先澄清（P1）

1. 新建会话，发送：`帮我生成一张狗的图片` / `Generate a dog`。
2. **期望**：收到反问（约 2–4 点）+ 建议提示词；**没有**新图片资产；网络侧无图像 bot 调用（或日志可证仅文本模型）。
3. 按建议确认或点「立即生成」。
4. **期望**：出现生图结果并落盘。

## Scenario B — 跳过澄清（P1）

1. 发送模糊需求后，立刻点「跳过澄清」，或回复 `直接生成` / `just generate`。
2. **期望**：不再继续拷问，尽快生图（提示词可含假设说明）。

## Scenario C — 移除 ✨

1. 打开对话输入区。
2. **期望**：无优化/撤销旁路图标；发送走 Agent。

## Scenario D — 无密钥

1. 去掉 Key 重启。
2. **期望**：chat/generate 均被阻止并提示配置。

## Pass criteria

- SC-001～SC-004 可演示通过。
