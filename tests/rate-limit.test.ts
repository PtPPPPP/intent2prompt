import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRateLimitStore, RedisRateLimitStore, resetRateLimitState } from "@/lib/rateLimit";

afterEach(() => { vi.unstubAllGlobals(); resetRateLimitState(); });

describe("MemoryRateLimitStore", () => {
  it("counts keys independently and resets after its window", async () => {
    let now = 0;
    const store = new MemoryRateLimitStore(() => now);
    await expect(store.increment("a", 60)).resolves.toEqual({ count: 1, ttlSeconds: 60 });
    await expect(store.increment("a", 60)).resolves.toMatchObject({ count: 2 });
    await expect(store.increment("b", 60)).resolves.toMatchObject({ count: 1 });
    now = 60_000;
    await expect(store.increment("a", 60)).resolves.toEqual({ count: 1, ttlSeconds: 60 });
  });
});

describe("RedisRateLimitStore", () => {
  it("sets expiry only for a new key and sends the token only in Authorization", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ result: 1 }, { result: -1 }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const store = new RedisRateLimitStore("https://redis.example/api?secret=never", "token-value", 1000);
    await expect(store.increment("hashed-key", 60)).resolves.toEqual({ count: 1, ttlSeconds: 60 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/pipeline");
    expect(JSON.stringify(fetchMock.mock.calls[0][1])).toContain("hashed-key");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer token-value" });
  });

  it("rejects malformed Redis responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(new RedisRateLimitStore("https://redis.example", "token").increment("key", 60)).rejects.toThrow("Invalid Redis REST response");
  });
});
