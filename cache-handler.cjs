/**
 * In-memory Next.js data cache for self-hosted single-server deployments.
 *
 * Why: the default cache persists entries on disk (.next/cache) but keeps tag
 * invalidations in memory. An admin edit followed by a restart — before any
 * visitor re-rendered the page — resurrected the stale entry for up to an hour
 * (verified). Keeping everything in memory means a restart always starts fresh.
 * On Vercel this handler is not used (next.config.ts): its managed data cache
 * coordinates tag invalidation across instances.
 */
const MAX_ENTRIES = 1000;
const cache = new Map();

module.exports = class InMemoryCacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    // Refresh recency for simple LRU eviction.
    cache.delete(key);
    cache.set(key, entry);
    return entry;
  }

  async set(key, data, ctx) {
    cache.delete(key);
    cache.set(key, { value: data, lastModified: Date.now(), tags: (ctx && ctx.tags) || [] });
    while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
  }

  async revalidateTag(tags) {
    const list = [tags].flat();
    for (const [key, entry] of cache) {
      if (entry.tags.some((tag) => list.includes(tag))) cache.delete(key);
    }
  }

  resetRequestCache() {}
};
