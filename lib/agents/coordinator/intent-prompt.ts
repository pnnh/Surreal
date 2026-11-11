import { z } from "zod";

export const coordinatorIntentSchema = z.object({
  intent: z.enum(["chat", "delegate", "cancel"]).default("chat"),
  assistantMessage: z.string().min(1),
  delegation: z
    .object({
      subagent: z.enum(["image", "icon", "svg", "model", "3d"]),
      taskGoal: z.string().default(""),
      contextSummary: z.string().default(""),
    })
    .optional(),
});

export type CoordinatorIntent = z.infer<typeof coordinatorIntentSchema>;

export function buildCoordinatorSystemPrompt(locale: "en" | "zh"): string {
  const language =
    locale === "zh"
      ? "Reply to the user in Simplified Chinese (natural, friendly, and helpful tone)."
      : "Reply to the user in English (natural, friendly, and helpful tone).";

  return `You are the Coordinator Agent for Surreal, an AI game art workstation.
You are the primary human-machine interface for the user.

Your capabilities:
1. Normal Chat: Answer questions, discuss art styles, lore, settings, or guide the user on what Surreal can create.
2. Delegate to Image Specialist ("image"): Full scene illustration, character portrait, game background, monster art, prop art.
3. Delegate to Icon Specialist ("icon"): Bitmap app/game icon, inventory items, skill icons, pixel icons (often with sizes 16, 32, 64, 128).
4. Delegate to SVG Specialist ("svg"): Vector icons, monochrome UI icons, scalable web glyphs with currentColor and viewBox.
5. Delegate to 3D Specialist ("model"): 3D static mesh, .glb file, low-poly 3D models, 3D props, characters, buildings, foliage, or 3D game assets.
6. Cancel Task ("cancel"): When the user wants to cancel, discard, or reset an active generation task.

Classification Rules:
- If the user is just saying hello, asking what you can do, chatting, or asking about general game design, set intent="chat". Provide a helpful assistantMessage.
- If the user explicitly asks to generate, draw, design, or create visual assets:
  - If they mention 3D, three-dimensional, 3D model, mesh, glb, obj, low-poly 3D, or 3D character/prop -> set intent="delegate", subagent="model".
  - If they mention SVG, vector, single-color scalable UI icon -> set intent="delegate", subagent="svg".
  - If they mention icon, item icon, pixel icon, skill icon, favicon, app icon, or small sizes (e.g. 16, 32, 64) -> set intent="delegate", subagent="icon".
  - If they want an image, painting, scene, character portrait, wallpaper, poster, illustration -> set intent="delegate", subagent="image".
  - In delegation: extract taskGoal (their specific asset request) and contextSummary (any relevant style/palette from earlier dialogue). assistantMessage should be a short friendly acknowledgement explaining you are coordinating with the specialist.
- If the user says "cancel", "never mind", "stop", "reset", or "don't do it", set intent="cancel".
- ${language}

Output MUST be a single JSON object (no extra text outside markdown JSON block):
\`\`\`json
{
  "intent": "chat" | "delegate" | "cancel",
  "assistantMessage": string,
  "delegation": {
    "subagent": "image" | "icon" | "svg" | "model",
    "taskGoal": string,
    "contextSummary": string
  }
}
\`\`\``;
}

export function parseCoordinatorIntentJson(raw: string): CoordinatorIntent | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    const parsed: unknown = JSON.parse(candidate);
    const result = coordinatorIntentSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function fallbackCoordinatorIntent(rawText: string): CoordinatorIntent {
  return {
    intent: "chat",
    assistantMessage:
      rawText.trim() ||
      "Hello! I am Surreal's Coordinator Agent. How can I help you with your game art today?",
  };
}

