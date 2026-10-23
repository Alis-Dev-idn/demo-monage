let counter = 0;

/**
 * Generates a collision-resistant unique ID using a counter + timestamp.
 * - Always monotonic within a single session (counter never repeats).
 * - Resistant to clock skew since the counter is the tie-breaker.
 *
 * Use this instead of `Math.random().toString(36).substring(...)` for
 * short-lived UI IDs (toasts, modals, dialogs).
 *
 * @example
 *   uid()           // "id-l5k3p2-0"
 *   uid("toast")    // "toast-l5k3p2-1"
 */
export function uid(prefix = "id"): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/**
 * RFC4122 v4 UUID. Falls back to a counter-based ID if `crypto.randomUUID`
 * is unavailable (older browsers / non-secure context).
 *
 * Prefer `uid()` for UI-only IDs (cheaper). Reserve `uuid()` for IDs that
 * may leave the session (server payloads, persistent storage keys).
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return uid("uuid");
}
