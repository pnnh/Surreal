import { describe, expect, it } from "vitest";
import {
  createConversation,
  getConversation,
} from "@/lib/db/conversations";
import {
  createSubagentTask,
  getActiveSubagentTask,
  getSubagentTask,
  listTasksForConversation,
  updateSubagentTask,
} from "@/lib/db/tasks";

describe("Coordinator Task Lifecycle & DB Integration", () => {
  it("creates a general conversation by default", () => {
    const conv = createConversation();
    expect(conv.kind).toBe("general");
    expect(conv.activeTaskId).toBeNull();
  });

  it("creates subagent task and links activeTaskId to conversation", () => {
    const conv = createConversation();
    const task = createSubagentTask({
      conversationId: conv.id,
      subagentType: "icon",
      status: "in_grill",
      clarifyingQuestions: ["What size?", "Transparent background?"],
      suggestedPrompt: "a magic potion bottle",
      suggestedSizes: [16, 32],
    });

    expect(task.id).toBeDefined();
    expect(task.subagentType).toBe("icon");
    expect(task.status).toBe("in_grill");
    expect(task.clarifyingQuestions).toHaveLength(2);
    expect(task.suggestedSizes).toEqual([16, 32]);

    // Active task pointer check
    const active = getActiveSubagentTask(conv.id);
    expect(active?.id).toBe(task.id);

    const reloadedConv = getConversation(conv.id);
    expect(reloadedConv?.activeTaskId).toBe(task.id);
  });

  it("updates task to ready when user provides parameters", () => {
    const conv = createConversation();
    const task = createSubagentTask({
      conversationId: conv.id,
      subagentType: "svg",
      status: "in_grill",
      clarifyingQuestions: ["Monochrome or multi-color?"],
    });

    const updated = updateSubagentTask(task.id, {
      status: "ready",
      clarifyingQuestions: [],
      suggestedPrompt: "clean monochrome shield SVG with currentColor",
    });

    expect(updated?.status).toBe("ready");
    expect(updated?.clarifyingQuestions).toHaveLength(0);
    expect(updated?.suggestedPrompt).toContain("currentColor");
  });

  it("clears conversation activeTaskId when task is completed or cancelled", () => {
    const conv = createConversation();
    const task = createSubagentTask({
      conversationId: conv.id,
      subagentType: "image",
      status: "in_grill",
      suggestedPrompt: "epic mountain castle",
    });

    expect(getConversation(conv.id)?.activeTaskId).toBe(task.id);

    // Complete the task
    updateSubagentTask(task.id, {
      status: "completed",
      assetIds: ["mock-asset-1"],
    });

    const refreshed = getConversation(conv.id);
    expect(refreshed?.activeTaskId).toBeNull();
    expect(getActiveSubagentTask(conv.id)).toBeNull();

    // Verify task record is preserved in history
    const history = listTasksForConversation(conv.id);
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("completed");
    expect(history[0].assetIds).toEqual(["mock-asset-1"]);
  });

  it("handles cancelled task properly", () => {
    const conv = createConversation();
    const task = createSubagentTask({
      conversationId: conv.id,
      subagentType: "icon",
      status: "in_grill",
    });

    updateSubagentTask(task.id, {
      status: "cancelled",
    });

    expect(getConversation(conv.id)?.activeTaskId).toBeNull();
    const loaded = getSubagentTask(task.id);
    expect(loaded?.status).toBe("cancelled");
  });
});

