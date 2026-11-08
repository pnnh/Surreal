# MCP Tools Contract: surreal-image (005 extensions)

## `generate_svg_icon`

**Description**: Generate a single CSS-colorable/scalable SVG icon from a text prompt (no clarification). Saves under `…/<conversationId>/svg/`.

**Input**:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| prompt | string | yes | Non-empty; describes the icon |
| model | string | no | Poe **text** model id; default `SURREAL_AGENT_MODEL` / GPT-4o-Mini |

**Output** (JSON in tool content):

```json
{
  "conversationId": "...",
  "assistantMessageId": "...",
  "assets": [
    {
      "id": "...",
      "fileUrl": "/api/assets/.../file",
      "absolutePath": ".../data/assets/{conversationId}/svg/{id}.svg",
      "mimeType": "image/svg+xml",
      "assetType": "svg",
      "favorite": false,
      "prompt": "...",
      "model": "GPT-4o-Mini"
    }
  ]
}
```

**Guarantees**:
- Persisted markup includes `viewBox`
- Primary paint uses `currentColor` (or sanitize rewrite / error)
- No `<script>` / `javascript:` URLs

**Errors**: Missing key; empty prompt; sanitize failure → `isError` + message

## Unchanged

- `generate_image`, `generate_icon`, `list_image_models`
