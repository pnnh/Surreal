const SKIP_PATTERNS: RegExp[] = [
  /直接生成/,
  /马上生成/,
  /立即生成/,
  /不要再问/,
  /别再问/,
  /跳过澄清/,
  /不用问了/,
  /直接出图/,
  /\bjust\s+generate\b/i,
  /\bgenerate\s+now\b/i,
  /\bskip\s+(clarification|questions?)\b/i,
  /\bno\s+more\s+questions?\b/i,
  /\bstop\s+asking\b/i,
  /\bdon'?t\s+ask\b/i,
];

/** Detect natural-language intent to skip further grilling. */
export function detectsSkipClarification(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  return SKIP_PATTERNS.some((re) => re.test(value));
}
