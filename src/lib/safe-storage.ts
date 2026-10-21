/**
 * Defensive helpers around `localStorage`.
 *
 * The prototype stores demo state (contestants, prizes, submissions) in the
 * browser. `localStorage` is shared, user-editable and survives across app
 * versions, so a raw `JSON.parse` can throw and take a whole page down. These
 * helpers never throw: a corrupt or unexpected value falls back to a safe
 * default, and writes are best-effort (private-mode browsers and quota errors
 * are ignored rather than crashing the interaction).
 */

/** Narrows unknown JSON to a plain object (not null, not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrows unknown JSON to an array. */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Returns a defensive copy of the fallback so callers can never mutate shared state. */
function cloneFallback<T>(fallback: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(fallback);
  } catch {
    /* fall through to the JSON clone */
  }
  try {
    return JSON.parse(JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
}

/**
 * Reads and parses a JSON value from local storage.
 *
 * @param key       storage key
 * @param fallback  value returned when the key is missing, unreadable or invalid
 * @param validate  optional runtime type guard; when it rejects the stored
 *                  value the fallback is returned instead
 */
export function readJson<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  if (typeof window === "undefined") return cloneFallback(fallback);

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return cloneFallback(fallback);

    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return cloneFallback(fallback);
    return parsed as T;
  } catch {
    // Corrupt JSON (or storage access denied) — fall back instead of crashing.
    return cloneFallback(fallback);
  }
}

/**
 * Writes a JSON value to local storage. Returns false when the write could not
 * be performed (storage disabled, quota exceeded, serialization failure).
 */
export function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Removes a key, ignoring storage failures. */
export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** True when two values serialize to the same JSON (cheap change detection). */
export function jsonEquals(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
