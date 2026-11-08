# Data Model: 轻量生图 Agent

## 既有实体（复用）

- **Conversation / Message / Asset / GenerationProfile**：保持 001 语义。

## 扩展

### Message.meta（新增，JSON 文本列或等价）

| Field | Type | Rules |
| --- | --- | --- |
| kind | enum | `agent_reply` \| `image_result` \| `user`（可选） |
| clarifyingQuestions | string[] | 长度 0–4 |
| suggestedPrompt | string | 可空 |
| readyToGenerate | boolean | |
| assumptions | string[] | 可选 |
| agentModel | string | 可选 |
| skipClarification | boolean | 用户本轮是否强制跳过 |

- 用户消息可记 `skipClarification`。
- Agent 回复必须可被 UI 反序列化以显示「立即生成」。

### AgentProfile（配置，可不入 DB）

| Field | Source | Default |
| --- | --- | --- |
| agentModel | `SURREAL_AGENT_MODEL` | `GPT-4o-Mini` |
| maxQuestionsPerRound | 常量 | 4 |
| minQuestionsHint | 常量 | 2（足够清晰可为 0） |

### GenerationGate（请求级，不持久化）

| Field | Type |
| --- | --- |
| conversationId | string |
| prompt | string（最终生图提示词） |
| model | string?（生图模型） |
| source | `confirm` \| `skip` |

## State flow

```text
User message
  → Agent turn (persist assistant + meta)
      → readyToGenerate=false → wait for more user input
      → readyToGenerate=true  → UI shows Generate Now
User confirm / skip
  → ImageJob via existing persist pipeline
  → assistant/image assets linked
```

## Validation

- `readyToGenerate=true` 且 `suggestedPrompt` 空 → 视为不可生成，前端禁用按钮，后端拒绝 generate。
- skip 时若无 suggestedPrompt，Agent/服务端 MUST 基于对话合成最小可用提示词后再生图。
