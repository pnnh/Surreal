# Feature Specification: MCP 直出图服务与会话管理

**Feature Branch**: `003-mcp-image-service`

**Created**: 2026-11-08

**Status**: Draft

**Input**: 聊天内图片收藏；将生图包装为 MCP（无认证、无反向拷问）；只读 MCP 会话管理页并可收藏 MCP 图片。

## User Scenarios & Testing

### User Story 1 - 聊天图片收藏 (Priority: P1)

在 Web 对话中，生成图片右下角显示收藏图标，可切换收藏状态。

**Acceptance Scenarios**:

1. **Given** 消息含生成图，**When** 点击右下角收藏图标，**Then** 该资产变为已收藏并持久化。
2. **Given** 已收藏图片，**When** 再次点击，**Then** 取消收藏。

### User Story 2 - MCP 直出图 (Priority: P1)

其它 AI Agent 通过 MCP 调用生图：直接使用提示词调用生图模型，**不做** grill 反问。暂无安全认证。

**Acceptance Scenarios**:

1. **Given** MCP 服务已启动且 Key 有效，**When** 调用 `generate_image` 并传入 prompt，**Then** 返回可访问的资产信息且本地落盘。
2. **Given** MCP 调用，**When** 完成，**Then** 创建/归属到 `source=mcp` 的会话记录。

### User Story 3 - MCP 会话只读管理 (Priority: P2)

管理页列出 MCP 生图会话（只读查看），并可收藏其中图片。

**Acceptance Scenarios**:

1. **Given** 存在 MCP 会话，**When** 打开 MCP 会话页，**Then** 可见会话列表与关联图片。
2. **Given** MCP 图片，**When** 在管理页点击收藏，**Then** 状态持久化且资产库可筛到。

## Requirements

- **FR-001**: 对话中生成图 MUST 提供右下角收藏切换。
- **FR-002**: MUST 提供 MCP Server（stdio），工具至少含直出图 `generate_image`（可选 list_models）。
- **FR-003**: MCP 生图 MUST NOT 经过反向拷问 Agent。
- **FR-004**: MCP MVP MUST NOT 实现认证。
- **FR-005**: 会话 MUST 区分 `web` / `mcp` 来源。
- **FR-006**: MUST 提供只读 MCP 会话列表页，支持收藏图片。
- **FR-007**: 密钥仍仅环境变量。

## Success Criteria

- **SC-001**: 聊天内可完成收藏切换且刷新后保持。
- **SC-002**: MCP `generate_image` 可不经澄清直接出图。
- **SC-003**: 管理页仅展示 MCP 会话，Web 会话不混入。

## Assumptions

- MCP 用 `@modelcontextprotocol/sdk` + 共享 `lib/generation`。
- 无认证意味着仅本机/受信环境使用。
