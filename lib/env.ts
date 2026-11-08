import path from "node:path";

export type AppEnv = {
  poeApiKey: string | null;
  poeBaseUrl: string;
  dataDir: string;
  contextLimit: number;
  poeConfigured: boolean;
  /** Text model for grill-style clarification agent */
  agentModel: string;
};

function parseContextLimit(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "6", 10);
  if (!Number.isFinite(n) || n < 2) return 6;
  return Math.min(n, 20);
}

export function getEnv(): AppEnv {
  const poeApiKey = process.env.POE_API_KEY?.trim() || null;
  const dataDir = path.resolve(
    process.env.SURREAL_DATA_DIR?.trim() || path.join(process.cwd(), "data"),
  );
  return {
    poeApiKey,
    poeBaseUrl: process.env.POE_BASE_URL?.trim() || "https://api.poe.com/v1",
    dataDir,
    contextLimit: parseContextLimit(process.env.SURREAL_CONTEXT_MESSAGE_LIMIT),
    poeConfigured: Boolean(poeApiKey),
    agentModel: process.env.SURREAL_AGENT_MODEL?.trim() || "GPT-4o-Mini",
  };
}

export function requirePoeApiKey(): string {
  const key = getEnv().poeApiKey;
  if (!key) {
    throw new Error(
      "POE_API_KEY is not configured. Set it in the environment (see .env.example).",
    );
  }
  return key;
}
