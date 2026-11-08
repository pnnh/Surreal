# Data Model: 文生图 MVP

## Entities

### GenerationProfile（全局单例）

| Field | Type | Rules |
| --- | --- | --- |
| id | string | 固定为 `default` |
| systemPrompt | string | 可空；最大 8KB |
| defaultModel | string | 默认 `GPT-Image-1.5` |
| updatedAt | datetime | ISO-8601 |

- 全表仅一行；更新覆盖写。
- 新生成读取当前值；不回溯历史消息。

### Conversation

| Field | Type | Rules |
| --- | --- | --- |
| id | string (ULID) | PK |
| title | string | 可空；可由首条提示词截断生成 |
| model | string | 会话当前选用模型（可改） |
| createdAt | datetime | |
| updatedAt | datetime | 有新消息时更新 |

### Message

| Field | Type | Rules |
| --- | --- | --- |
| id | string (ULID) | PK |
| conversationId | string | FK → Conversation |
| role | enum | `user` \| `assistant` \| `system` |
| content | string | 文本正文 |
| model | string \| null | 助手消息记录实际模型 |
| createdAt | datetime | |
| sequence | int | 会话内递增，保证顺序 |

- 发往 Poe 时：`system` 来自 Profile（可不入库为 message，或每次生成临时注入）。
- 上下文窗口：按 `sequence` 取最近 N 条 `user`/`assistant`。

### Asset

| Field | Type | Rules |
| --- | --- | --- |
| id | string (ULID) | PK |
| conversationId | string \| null | FK，可空 |
| messageId | string \| null | FK → 产生该图的助手消息 |
| prompt | string | 触发该图的用户提示词 |
| model | string | |
| mimeType | string | 如 `image/png` |
| storageKey | string | 相对 `StorageBackend` 的对象键 |
| width | int \| null | 可选 |
| height | int \| null | 可选 |
| favorite | boolean | 默认 false |
| createdAt | datetime | |

**Lifecycle**:
1. 生成成功 → 写入文件 → 插入 Asset → 关联 Message
2. 收藏切换 → 更新 `favorite`
3. 删除 → 删文件 + 删行（文件缺失仍删行）

### ModelAllowlistEntry（配置/常量）

| Field | Type | Rules |
| --- | --- | --- |
| id | string | Poe model id，如 `GPT-Image-1.5` |
| label | string | UI 显示名 |
| enabled | boolean | |

- MVP 可以代码常量 + JSON 契约提供；不一定进 SQLite。

## Relationships

```text
GenerationProfile (1)
Conversation (1) ──< Message (N)
Message (1) ──< Asset (0..N)
Conversation (1) ──< Asset (0..N)   # 冗余便于资产库查询
```

## Validation

- `POE_API_KEY` 缺失时拒绝生成（应用层）。
- `prompt` 空字符串拒绝。
- `storageKey` 必须落在数据目录内（防路径穿越）。
- 删除需显式确认标志（API：`confirm=true`）。

## Indexes

- `message(conversationId, sequence)`
- `asset(favorite, createdAt DESC)`
- `asset(conversationId)`
