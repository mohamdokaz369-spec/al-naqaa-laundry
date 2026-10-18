// Keep only a digest and random key in session storage, never customer details.
export async function orderRequestKey(payload: unknown, storage: Pick<Storage, "getItem" | "setItem">): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
  const digest = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  try {
    const previous = JSON.parse(storage.getItem("naqaa-order-request") || "null");
    if (previous?.digest === digest && typeof previous.key === "string" && now - previous.created < 24 * 60 * 60 * 1000) return previous.key;
  } catch { /* Storage may be disabled or corrupted; use a fresh key. */ }
  const key = crypto.randomUUID();
  try { storage.setItem("naqaa-order-request", JSON.stringify({ digest, key, created: now })); } catch { /* Private mode may disable storage. */ }
  return key;
}
