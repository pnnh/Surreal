import { ulid } from "ulid";
import { getDb } from "./client";
import { touchConversation } from "./conversations";
import type { SubagentTask, SubagentTaskStatus, SubagentType } from "./types";

type TaskRow = {
  id: string;
  conversation_id: string;
  subagent_type: string;
  status: string;
  clarifying_questions: string;
  suggested_prompt: string;
  suggested_sizes: string;
  model_category?: string | null;
  model_style?: string | null;
  asset_ids: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapTaskRow(row: TaskRow): SubagentTask {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    subagentType: (row.subagent_type as SubagentType) || "image",
    status: (row.status as SubagentTaskStatus) || "in_grill",
    clarifyingQuestions: safeJsonParse<string[]>(row.clarifying_questions, []),
    suggestedPrompt: row.suggested_prompt || "",
    suggestedSizes: safeJsonParse<number[]>(row.suggested_sizes, []),
    modelCategory: row.model_category ?? undefined,
    modelStyle: row.model_style ?? undefined,
    assetIds: safeJsonParse<string[]>(row.asset_ids, []),
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLS = `id, conversation_id, subagent_type, status, clarifying_questions, suggested_prompt, suggested_sizes, model_category, model_style, asset_ids, error_message, created_at, updated_at`;

export function createSubagentTask(input: {
  conversationId: string;
  subagentType: SubagentType;
  status?: SubagentTaskStatus;
  clarifyingQuestions?: string[];
  suggestedPrompt?: string;
  suggestedSizes?: number[];
  modelCategory?: string;
  modelStyle?: string;
  assetIds?: string[];
}): SubagentTask {
  const id = ulid();
  const now = new Date().toISOString();
  const status = input.status ?? "in_grill";
  const questionsJson = JSON.stringify(input.clarifyingQuestions ?? []);
  const prompt = input.suggestedPrompt ?? "";
  const sizesJson = JSON.stringify(input.suggestedSizes ?? []);
  const assetsJson = JSON.stringify(input.assetIds ?? []);

  getDb()
    .prepare(
      `INSERT INTO subagent_tasks (
        id, conversation_id, subagent_type, status, clarifying_questions,
        suggested_prompt, suggested_sizes, model_category, model_style, asset_ids, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    )
    .run(
      id,
      input.conversationId,
      input.subagentType,
      status,
      questionsJson,
      prompt,
      sizesJson,
      input.modelCategory ?? null,
      input.modelStyle ?? null,
      assetsJson,
      now,
      now,
    );

  // If status is active, point conversation.active_task_id to this task
  if (status === "in_grill" || status === "ready" || status === "generating") {
    touchConversation(input.conversationId, { activeTaskId: id });
  }

  return getSubagentTask(id)!;
}

export function getSubagentTask(id: string): SubagentTask | null {
  const row = getDb()
    .prepare(`SELECT ${SELECT_COLS} FROM subagent_tasks WHERE id = ?`)
    .get(id) as TaskRow | undefined;
  return row ? mapTaskRow(row) : null;
}

export function getActiveSubagentTask(
  conversationId: string,
): SubagentTask | null {
  // First check if conversation explicitly points to activeTaskId
  const convRow = getDb()
    .prepare(`SELECT active_task_id FROM conversations WHERE id = ?`)
    .get(conversationId) as { active_task_id: string | null } | undefined;

  if (convRow?.active_task_id) {
    const task = getSubagentTask(convRow.active_task_id);
    if (
      task &&
      (task.status === "in_grill" ||
        task.status === "ready" ||
        task.status === "generating")
    ) {
      return task;
    }
  }

  // Fallback: search latest pending task
  const row = getDb()
    .prepare(
      `SELECT ${SELECT_COLS} FROM subagent_tasks
       WHERE conversation_id = ? AND status IN ('in_grill', 'ready', 'generating')
       ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(conversationId) as TaskRow | undefined;

  return row ? mapTaskRow(row) : null;
}

export function updateSubagentTask(
  id: string,
  patch: {
    status?: SubagentTaskStatus;
    clarifyingQuestions?: string[];
    suggestedPrompt?: string;
    suggestedSizes?: number[];
    modelCategory?: string;
    modelStyle?: string;
    assetIds?: string[];
    errorMessage?: string | null;
  },
): SubagentTask | null {
  const current = getSubagentTask(id);
  if (!current) return null;

  const now = new Date().toISOString();
  const nextStatus = patch.status ?? current.status;
  const nextQuestions =
    patch.clarifyingQuestions !== undefined
      ? JSON.stringify(patch.clarifyingQuestions)
      : JSON.stringify(current.clarifyingQuestions);
  const nextPrompt =
    patch.suggestedPrompt !== undefined
      ? patch.suggestedPrompt
      : current.suggestedPrompt;
  const nextSizes =
    patch.suggestedSizes !== undefined
      ? JSON.stringify(patch.suggestedSizes)
      : JSON.stringify(current.suggestedSizes ?? []);
  const nextCategory =
    patch.modelCategory !== undefined
      ? patch.modelCategory
      : current.modelCategory ?? null;
  const nextStyle =
    patch.modelStyle !== undefined
      ? patch.modelStyle
      : current.modelStyle ?? null;
  const nextAssets =
    patch.assetIds !== undefined
      ? JSON.stringify(patch.assetIds)
      : JSON.stringify(current.assetIds ?? []);
  const nextError =
    patch.errorMessage !== undefined ? patch.errorMessage : current.errorMessage;

  getDb()
    .prepare(
      `UPDATE subagent_tasks
       SET status = ?, clarifying_questions = ?, suggested_prompt = ?,
           suggested_sizes = ?, model_category = ?, model_style = ?,
           asset_ids = ?, error_message = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      nextStatus,
      nextQuestions,
      nextPrompt,
      nextSizes,
      nextCategory,
      nextStyle,
      nextAssets,
      nextError,
      now,
      id,
    );

  // If task finished or cancelled, clear conversation.active_task_id
  if (
    nextStatus === "completed" ||
    nextStatus === "cancelled" ||
    nextStatus === "failed"
  ) {
    const convRow = getDb()
      .prepare(`SELECT active_task_id FROM conversations WHERE id = ?`)
      .get(current.conversationId) as { active_task_id: string | null } | undefined;
    if (convRow?.active_task_id === id) {
      touchConversation(current.conversationId, { activeTaskId: null });
    }
  }

  return getSubagentTask(id);
}

export function listTasksForConversation(
  conversationId: string,
): SubagentTask[] {
  const rows = getDb()
    .prepare(
      `SELECT ${SELECT_COLS} FROM subagent_tasks
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
    )
    .all(conversationId) as TaskRow[];
  return rows.map(mapTaskRow);
}

