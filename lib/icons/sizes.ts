export const DEFAULT_ICON_SIZES = [16, 32, 64] as const;

export const MAX_ICON_SIZES = 12;
export const MIN_ICON_SIZE = 16;
export const MAX_ICON_SIZE = 1024;

export type NormalizeSizesResult = {
  sizes: number[];
  usedDefault: boolean;
  rejected: number[];
};

/** Normalize icon edge lengths; empty/invalid → default [16,32,64]. */
export function normalizeIconSizes(
  input?: number[] | null,
): NormalizeSizesResult {
  const rejected: number[] = [];
  const seen = new Set<number>();
  const sizes: number[] = [];

  for (const raw of input ?? []) {
    const n = Math.round(Number(raw));
    if (
      !Number.isFinite(n) ||
      n < MIN_ICON_SIZE ||
      n > MAX_ICON_SIZE ||
      seen.has(n)
    ) {
      rejected.push(raw);
      continue;
    }
    seen.add(n);
    sizes.push(n);
    if (sizes.length >= MAX_ICON_SIZES) break;
  }

  if (!sizes.length) {
    return {
      sizes: [...DEFAULT_ICON_SIZES],
      usedDefault: true,
      rejected,
    };
  }

  sizes.sort((a, b) => a - b);
  return { sizes, usedDefault: false, rejected };
}

export function appendIconSizeToPrompt(prompt: string, size: number): string {
  const base = prompt.trim().replace(/\.?\s*$/, "");
  return `${base}, flat app icon, ${size}x${size} pixels, transparent background, no drop shadow, centered`;
}
