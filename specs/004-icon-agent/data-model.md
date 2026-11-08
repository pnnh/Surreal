# Data Model: 004-icon-agent

## Conversation

| Field | Type | Notes |
| --- | --- | --- |
| id | string (ULID) | PK |
| title | string \| null | |
| model | string | 生图模型 ID |
| source | `web` \| `mcp` | 既有 |
| kind | `image` \| `icon` | **新增**；默认 `image` |
| created_at / updated_at | ISO string | |

**Rules**:
- `kind` 创建后不可变（MVP）。
- `source=mcp` + `generate_icon` → `kind=icon`；`generate_image` → `kind=image`。

## Asset

| Field | Type | Notes |
| --- | --- | --- |
| id | string (ULID) | PK |
| conversation_id | string \| null | FK |
| message_id | string \| null | FK |
| prompt | string | 实际用于该尺寸的提示词 |
| model | string | |
| mime_type | string | e.g. `image/png`, `image/webp` |
| storage_key | string | 相对 `data/assets/` |
| width / height | number \| null | 目标尺寸（图标应写入边长） |
| favorite | boolean | |
| asset_type | `image` \| `icon` | **新增**；默认 `image` |
| created_at | ISO string | |

**storage_key 约定**:

```text
{conversationId}/images/{assetId}.{ext}   # kind=image
{conversationId}/icons/{assetId}.{ext}    # kind=icon
```

**Rules**:
- 图标批量：同一 `message_id` 可挂多个 asset（不同 width/height）。
- 列表过滤：`asset_type` + 既有 `favorite`。

## Message.meta（图标 Agent）

扩展既有 Agent JSON：

```json
{
  "kind": "agent_reply",
  "assistantMessage": "...",
  "clarifyingQuestions": ["..."],
  "suggestedPrompt": "...",
  "suggestedSizes": [16, 32, 64],
  "readyToGenerate": false,
  "assumptions": [],
  "agentModel": "GPT-4o-Mini"
}
```

生成结果 meta：

```json
{
  "kind": "image_result",
  "imagePrompt": "...",
  "sizes": [16, 32, 64],
  "assetType": "icon"
}
```

## State: Icon clarification → batch

```text
user_message
  → agent_turn (suggestedSizes?, readyToGenerate?)
  → [more turns...]
  → gate (confirm | skip)
  → IconBatchJob (per-size generate + persist)
  → assistant message + N assets
```

## Validation

- `kind` ∈ {image, icon}
- `asset_type` ∈ {image, icon}
- sizes: 正整数，建议 16–1024，单批 ≤ 12
- prompt: 非空 trim
