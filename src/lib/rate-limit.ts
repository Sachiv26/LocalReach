/**
 * Lightweight in-memory rate limiter.
 *
 * Suitable for a single instance / development. For multi-instance production
 * deployments swap the store for a distributed backend (e.g. Upstash Redis)
 * behind the same interface — call sites do not change.
 */

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as {
  __localreachRateBuckets?: Map<string, Bucket>;
};

const store =
  globalStore.__localreachRateBuckets ?? new Map<string, Bucket>();
globalStore.__localreachRateBuckets = store;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Periodic cleanup so the map does not grow unbounded. */
export function sweepRateLimits() {
  const now = Date.now();
    for (const [key, bucket] of Array.from(store.entries())) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}
