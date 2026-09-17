let counter = 0;

/**
 * Opaque local identifier for trips/destinations. Doesn't need to be
 * cryptographically random — only unique within this device's local data.
 */
export function generateId(prefix: string): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
