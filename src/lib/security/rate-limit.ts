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

/**
 * Failure-based lock: after `max` failures within `windowMs`, the key is locked
 * for `windowMs` from the last failure. Used per email for login — for existing
 * AND unknown emails alike, so lock behaviour never reveals whether an account exists.
 */
type FailureState = { count: number; last: number; lockedUntil: number };
const failures = new Map<string, FailureState>();

export function failureLockRemaining(key: string): number {
  const s = failures.get(key);
  if (!s) return 0;
  const now = Date.now();
  if (s.lockedUntil > now) return Math.ceil((s.lockedUntil - now) / 1000);
  return 0;
}

/** Records a failure; returns true when this failure triggers (or extends) a lock. */
export function registerFailure(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const s = failures.get(key);
  const state: FailureState = s && now - s.last < windowMs && s.lockedUntil <= now ? s : { count: 0, last: now, lockedUntil: 0 };
  state.count += 1;
  state.last = now;
  if (state.count >= max) {
    state.lockedUntil = now + windowMs;
    state.count = 0;
  }
  failures.set(key, state);
  if (failures.size > 50_000) {
    for (const [k, v] of failures) if (v.lockedUntil < now && now - v.last > windowMs) failures.delete(k);
  }
  return state.lockedUntil > now;
}

export function clearFailures(key: string) {
  failures.delete(key);
}
