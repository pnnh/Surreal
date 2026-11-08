const inflight = new Set<string>();

export function tryAcquireGenerationLock(conversationId: string): boolean {
  if (inflight.has(conversationId)) return false;
  inflight.add(conversationId);
  return true;
}

export function releaseGenerationLock(conversationId: string): void {
  inflight.delete(conversationId);
}
