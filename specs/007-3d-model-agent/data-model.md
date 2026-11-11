# Phase 1: Data Model & Schema Design

**Feature**: 007-3d-model-agent (3D 静态模型生成专有 Agent 与可插拔 Provider 架构)
**Date**: 2026-11-11

---

## 1. 核心类型扩展 (`lib/db/types.ts`)

### 1.1 `AssetType` 扩展
在现有的 `image`、`icon`、`svg` 基础上扩充 3D 模型资产：
```typescript
export type AssetType = "image" | "icon" | "svg" | "model";
```

### 1.2 `ConversationKind` 扩展
支持通用会话以及 3D 专属会话类型：
```typescript
export type ConversationKind = "general" | "image" | "icon" | "svg" | "model";
```

### 1.3 `SubagentType` 扩展
支持主 Agent 派发任务给 3D 专家：
```typescript
export type SubagentType = "image" | "icon" | "svg" | "model" | "3d";
```

---

## 2. 3D 专有模型与参数元数据

### 2.1 3D 资产类别 (`ModelCategory`)
```typescript
export type ModelCategory = "character" | "prop" | "hard_surface" | "foliage";
```

### 2.2 3D 美术风格 (`ModelStyle`)
```typescript
export type ModelStyle = "low-poly" | "pbr" | "stylized";
```

### 2.3 3D 生成请求配置 (`ThreeDGenerateOptions`)
```typescript
export interface ThreeDGenerateOptions {
  prompt: string;
  category?: ModelCategory;
  style?: ModelStyle;
  seed?: number;
  imageUrl?: string;
  timeoutMs?: number;
}
```

### 2.4 3D 资产元数据 (`Asset.metadata`)
存入 SQLite `assets.metadata_json` 的结构：
```typescript
export interface ModelAssetMetadata {
  category: ModelCategory;
  style: ModelStyle;
  format: "glb";
  byteSize: number;
  provider: "mock" | "custom_http" | "fal_ai";
  prompt: string;
  seed?: number;
  vertexCount?: number;
  faceCount?: number;
}
```

---

## 3. 文件系统存储模型

每个会话的资产隔离存储在 `data/assets/<conversationId>/` 目录下：

```text
data/assets/
└── {conversation_id}/
    ├── images/
    │   └── {asset_id}.png
    ├── icons/
    │   └── {asset_id}.png
    ├── svg/
    │   └── {asset_id}.svg
    └── models/
        └── {asset_id}.glb    # [新增] 3D 二进制 glTF 文件
```

- 文件格式：`.glb` (glTF 2.0 Binary)
- 文件权限与落盘：原子写入，写入前校验 4 字节魔数 `glTF`。
- 访问 URL：通过现有的 `/api/assets/[assetId]` 路由直接流式输出 `model/gltf-binary`。

