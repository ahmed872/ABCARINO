/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single Node process (the recommended deployment). When scaling
 * horizontally, replace the store with Redis/Postgres behind the same interface.
 */
type Bucket = { hits: number[] };

const stores = new Map<string, Map<string, Bucket>>();
let lastSweep = Date.now();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(namespace: string, key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  sweep(now);
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    store.set(key, bucket);
    const retryAfterMs = windowMs - (now - bucket.hits[0]);
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

export function resetRateLimit(namespace: string, key: string) {
  stores.get(namespace)?.delete(key);
}

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const maxAge = 24 * 60 * 60 * 1000;
  for (const store of stores.values()) {
    for (const [key, bucket] of store) {
      if (!bucket.hits.length || now - bucket.hits[bucket.hits.length - 1] > maxAge) store.delete(key);
    }
  }
}
