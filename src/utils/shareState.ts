// Static-friendly "collaboration": there's no backend, so the crew shares
// progress by passing a code (or a URL with #s=). State stays per-device;
// importing MERGES (never overwrites) so teammates' progress adds up.

/** JSON → URL-safe base64 string. */
export function encodeState(obj: unknown): string {
  const json = JSON.stringify(obj);
  // utf8-safe base64
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** URL-safe base64 string → parsed object (or null if malformed). */
export function decodeState<T = unknown>(code: string): T | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Merge a decoded boolean-map into the current one — truthy wins, nothing is unset. */
export function mergeBoolMap(
  current: Record<string, boolean>,
  incoming: Record<string, boolean>,
): Record<string, boolean> {
  const out = { ...current };
  for (const [k, v] of Object.entries(incoming)) if (v) out[k] = true;
  return out;
}
