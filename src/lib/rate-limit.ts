// Simple in-memory rate limiter for MVP. Replace with Redis-backed in production.
const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, reset: entry.reset };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, reset: entry.reset };
}

// Prune stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.reset) store.delete(key);
    }
  }, 60_000);
}
