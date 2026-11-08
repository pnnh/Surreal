# MCP Tools Contract: surreal-image (004 extensions)

既有工具保持不变；本 feature 新增：

## `generate_icon`

**Description**: Generate app/web bitmap icons from a prompt (no clarification). Saves under the conversation `icons/` directory.

**Input**:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| prompt | string | yes | Non-empty |
| sizes | number[] | no | Positive pixel edge lengths; default `[16,32,64]`; max 12 items; each 16–1024 |
| model | string | no | Poe image model id; default allowlist default |

**Output** (text JSON in tool content):

```json
{
  "conversationId": "...",
  "assistantMessageId": "...",
  "assets": [
    {
      "id": "...",
      "fileUrl": "/api/assets/.../file",
      "absolutePath": ".../data/assets/{conversationId}/icons/{id}.png",
      "width": 32,
      "height": 32,
      "mimeType": "image/png",
      "favorite": false,
      "prompt": "...",
      "model": "GPT-Image-1.5"
    }
  ]
}
```

**Errors**: Missing `POE_API_KEY`; empty prompt; invalid sizes → `isError` + readable message.

## Unchanged

- `generate_image` — ordinary images → `images/` path after storage layout change
- `list_image_models` — shared allowlist
