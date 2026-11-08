import { getDb } from "./client";
import type { GenerationProfile } from "./types";

type Row = {
  id: string;
  system_prompt: string;
  default_model: string;
  updated_at: string;
};

function mapRow(row: Row): GenerationProfile {
  return {
    id: "default",
    systemPrompt: row.system_prompt,
    defaultModel: row.default_model,
    updatedAt: row.updated_at,
  };
}

export function getProfile(): GenerationProfile {
  const row = getDb()
    .prepare(
      `SELECT id, system_prompt, default_model, updated_at
       FROM generation_profile WHERE id = 'default'`,
    )
    .get() as Row;
  return mapRow(row);
}

export function updateProfile(input: {
  systemPrompt?: string;
  defaultModel?: string;
}): GenerationProfile {
  const current = getProfile();
  const systemPrompt =
    input.systemPrompt !== undefined ? input.systemPrompt : current.systemPrompt;
  const defaultModel =
    input.defaultModel !== undefined ? input.defaultModel : current.defaultModel;
  if (systemPrompt.length > 8 * 1024) {
    throw new Error("systemPrompt exceeds 8KB limit");
  }
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE generation_profile
       SET system_prompt = ?, default_model = ?, updated_at = ?
       WHERE id = 'default'`,
    )
    .run(systemPrompt, defaultModel, updatedAt);
  return getProfile();
}
