# Data Model: 005-svg-icon

## Conversation

| Field | Type | Notes |
| --- | --- | --- |
| kind | `image` \| `icon` \| `svg` | **扩展** `svg`；默认 `image`；创建后不可变 |

其余字段同 004（source、model、title、timestamps）。

**Rules**:
- MCP `generate_svg_icon` → `source=mcp` + `kind=svg`
- Web 新建选 SVG → `kind=svg`

## Asset

| Field | Type | Notes |
| --- | --- | --- |
| asset_type | `image` \| `icon` \| `svg` | **扩展** `svg` |
| mime_type | string | SVG 为 `image/svg+xml` |
| storage_key | string | `{conversationId}/svg/{assetId}.svg` |
| width / height | number \| null | SVG 可空（尺寸由 CSS）；可选记 viewBox 宽高比 |

**Rules**:
- 列表过滤：`GET /api/assets?type=svg`
- 收藏字段不变

## Message.meta

Agent（svg 会话）仍用：

```json
{
  "kind": "agent_reply",
  "assistantMessage": "...",
  "clarifyingQuestions": [],
  "suggestedPrompt": "flat mono shopping cart icon…",
  "suggestedSizes": [],
  "readyToGenerate": true,
  "assumptions": [],
  "agentModel": "GPT-4o-Mini"
}
```

生成结果：

```json
{
  "kind": "image_result",
  "imagePrompt": "...",
  "assetType": "svg"
}
```

## SvgArtifact（运行时，非独立表）

| Field | Notes |
| --- | --- |
| rawModelText | 模型原始输出 |
| svgMarkup | 剥离围栏并截取的 `<svg>…</svg>` |
| hasViewBox | 校验 |
| usesCurrentColor | 校验/改写后 |
| rejectedReason | 可选 |

## State

```text
user_message
  → svg agent_turn (readyToGenerate?)
  → gate (confirm | skip)
  → text model SVG completion
  → sanitize/validate
  → persist .svg + asset_type=svg
  → assistant message + preview
```

## Validation

- kind/asset_type ∈ {image, icon, svg}
- SVG：必须匹配根 `<svg`；必须有 `viewBox`；禁止 script / javascript: / 危险事件处理器
- prompt 非空
