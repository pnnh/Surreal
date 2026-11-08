# Implementation Plan: MCP 直出图服务

**Branch**: `003-mcp-image-service` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

## Summary

扩展会话 `source`（web/mcp）；聊天消息图片加收藏角标；新增 stdio MCP Server 直调生图；新增 `/mcp-sessions` 只读管理页。

## Technical Context

**Stack**: 既有 Next.js + `node:sqlite`；新增 `@modelcontextprotocol/sdk`、`tsx`  
**MCP entry**: `pnpm mcp` → `mcp/server.ts`（stdio）  
**Tools**: `generate_image`, `list_image_models`  
**Auth**: none (MVP)

## Constitution Check

PASS — 密钥仍环境变量；MCP 无认证仅本机；不引入 3D/多租户。

## Structure

```text
mcp/server.ts
lib/db/conversations.ts   # source field
lib/mcp/generate.ts       # shared direct generate for MCP
components/chat/FavoriteImage.tsx
app/(app)/mcp-sessions/page.tsx
app/api/mcp/sessions/route.ts
```
