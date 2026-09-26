// Simple sliding-window limiter. On Vercel each instance keeps its own window;
// for strict global limits swap this for Upstash Redis (@upstash/ratelimit).
type Bucket = { windowMs: number; times: number[] };
const hits = new Map<string, Bucket>();
const MAX_KEYS = 5000;

/** Drops expired buckets; if still over the cap, drops the least-recently-used ones (Map keeps insertion order). */
function evict(now: number) {
  for (const [key, b] of hits) {
    if (now - b.times[b.times.length - 1] >= b.windowMs) hits.delete(key);
  }
  for (const key of hits.keys()) {
    if (hits.size <= MAX_KEYS) break;
    hits.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key)?.times ?? []).filter((t) => now - t < windowMs);
  // Re-insert so the key moves to the end of the Map (most recently used).
  hits.delete(key);
  if (recent.length >= limit) {
    hits.set(key, { windowMs, times: recent });
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, { windowMs, times: recent });
  if (hits.size > MAX_KEYS) evict(now);
  return { ok: true, retryAfter: 0 };
}

/** Groups IPv6 addresses by their /64 prefix (one subscriber usually owns a whole /64). */
function normaliseIp(ip: string) {
  const v4mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (v4mapped) return v4mapped[1];
  if (!ip.includes(":")) return ip;
  const addr = ip.split("%")[0].toLowerCase();
  const [head, tail] = addr.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail !== undefined && tail ? tail.split(":") : [];
  const missing = tail !== undefined ? Math.max(0, 8 - headParts.length - tailParts.length) : 0;
  const parts = [...headParts, ...Array<string>(missing).fill("0"), ...tailParts];
  return `${parts.slice(0, 4).map((p) => p.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/**
 * Client address for rate limiting. Prefers headers set by the platform (Vercel overwrites
 * x-vercel-forwarded-for / x-real-ip), then the right-most x-forwarded-for hop, which is the one
 * appended by the nearest proxy. The left-most XFF value is client-controlled and is never used.
 */
export function clientKey(req: Request) {
  const h = req.headers;
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip")?.trim() ||
    xff?.[xff.length - 1] ||
    "";
  return ip ? normaliseIp(ip) : "anon";
}
