import allowlist from "./allowlist.json";

export type ModelEntry = {
  id: string;
  label: string;
  enabled: boolean;
};

export type ModelAllowlist = {
  defaultModel: string;
  models: ModelEntry[];
  allowCustomModelId: boolean;
};

export function getModelAllowlist(): ModelAllowlist {
  return allowlist as ModelAllowlist;
}

export function resolveModelId(requested?: string | null): string {
  const list = getModelAllowlist();
  const id = requested?.trim();
  if (!id) return list.defaultModel;
  const known = list.models.find((m) => m.id === id && m.enabled);
  if (known) return known.id;
  if (list.allowCustomModelId) return id;
  return list.defaultModel;
}
