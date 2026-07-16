import { getEnv, type RateLimitFailureMode } from "./env";

export interface RateLimitIncrement { count: number; ttlSeconds: number; }
export interface RateLimitStore { increment(key: string, windowSeconds: number): Promise<RateLimitIncrement>; }
export class RateLimitStoreUnavailableError extends Error {}
export type RateLimitStatus = "available" | "fallback-memory" | "unavailable";

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, { count: number; expiresAt: number }>();
  constructor(private readonly now = () => Date.now()) {}

  async increment(key: string, windowSeconds: number): Promise<RateLimitIncrement> {
    const now = this.now();
    const current = this.counters.get(key);
    if (!current || current.expiresAt <= now) {
      this.counters.set(key, { count: 1, expiresAt: now + windowSeconds * 1_000 });
      return { count: 1, ttlSeconds: windowSeconds };
    }
    current.count += 1;
    return { count: current.count, ttlSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1_000)) };
  }

  reset(): void { this.counters.clear(); }
}

type RedisPipelineResult = Array<{ result?: unknown }>;

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly url: string, private readonly token: string, private readonly timeoutMs = 3_000) {}

  private async request(path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(`${this.url.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new RateLimitStoreUnavailableError("Redis REST request failed");
    return response;
  }

  async increment(key: string, windowSeconds: number): Promise<RateLimitIncrement> {
    const response = await this.request("/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["TTL", key]]),
    });
    let values: RedisPipelineResult;
    try { values = await response.json() as RedisPipelineResult; } catch { throw new RateLimitStoreUnavailableError("Invalid Redis REST response"); }
    const count = values[0]?.result;
    const ttl = values[1]?.result;
    if (typeof count !== "number" || !Number.isInteger(count) || typeof ttl !== "number" || !Number.isInteger(ttl)) {
      throw new RateLimitStoreUnavailableError("Invalid Redis REST response");
    }

    if (ttl < 1) {
      const expiry = await this.request(`/expire/${encodeURIComponent(key)}/${windowSeconds}`, { method: "POST" });
      let expiryResult: { result?: unknown };
      try { expiryResult = await expiry.json() as { result?: unknown }; } catch { throw new RateLimitStoreUnavailableError("Invalid Redis REST response"); }
      if (expiryResult.result !== 1 && expiryResult.result !== true) throw new RateLimitStoreUnavailableError("Redis expiry was not set");
      return { count, ttlSeconds: windowSeconds };
    }
    return { count, ttlSeconds: ttl };
  }
}

const memoryStore = new MemoryRateLimitStore();
let lastRateLimitStatus: RateLimitStatus = "available";
let lastRateLimitStore = "memory";

export function resetRateLimitState(): void { memoryStore.reset(); lastRateLimitStatus = "available"; }
export function getRateLimitHealth(): { store: "memory" | "redis"; status: RateLimitStatus } {
  return { store: getEnv().rateLimitStore, status: lastRateLimitStore === "redis" ? lastRateLimitStatus : "available" };
}

function configuredStore(): RateLimitStore {
  const env = getEnv();
  if (env.rateLimitStore === "redis" && env.rateLimitRedisUrl && env.rateLimitRedisToken) {
    lastRateLimitStore = "redis";
    return new RedisRateLimitStore(env.rateLimitRedisUrl, env.rateLimitRedisToken, env.rateLimitRedisTimeoutMs);
  }
  lastRateLimitStore = "memory";
  return memoryStore;
}

async function consume(store: RateLimitStore, scope: string, clientKey: string): Promise<RateLimitResult> {
  const env = getEnv();
  const minute = await store.increment(`intent2prompt:rate-limit:${scope}:${clientKey}:minute`, 60);
  const day = await store.increment(`intent2prompt:rate-limit:${scope}:${clientKey}:day`, 86_400);
  const exceededMinute = minute.count > env.rateLimitPerMinute;
  const exceededDay = day.count > env.rateLimitPerDay;
  return { allowed: !exceededMinute && !exceededDay, retryAfter: exceededMinute ? minute.ttlSeconds : day.ttlSeconds };
}

export interface RateLimitResult { allowed: boolean; retryAfter: number; }
export async function checkRateLimit(scope: string, clientKey: string): Promise<RateLimitResult> {
  const env = getEnv();
  try {
    const result = await consume(configuredStore(), scope, clientKey);
    lastRateLimitStatus = "available";
    return result;
  } catch {
    lastRateLimitStatus = env.rateLimitFailureMode === "deny" ? "unavailable" : "fallback-memory";
    if (env.rateLimitFailureMode === "deny") throw new RateLimitStoreUnavailableError();
    console.warn(JSON.stringify({ type: "rate_limit_fallback", scope, rateLimitStore: "redis" }));
    return consume(memoryStore, `fallback:${scope}`, clientKey);
  }
}
