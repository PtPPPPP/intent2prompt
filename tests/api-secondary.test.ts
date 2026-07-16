import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as generate } from "@/app/api/generate/route";
import { POST as feedback } from "@/app/api/feedback/route";
import { POST as events } from "@/app/api/events/route";
import { GET as health } from "@/app/api/health/route";
import { resetRateLimitState } from "@/lib/rateLimit";

function request(url: string, body: unknown): Request {
  return new Request(url, { method: "POST", headers: { "Content-Type": "application/json", "x-anonymous-client-id": "client-identifier-1234" }, body: JSON.stringify(body) });
}

afterEach(() => {
  delete process.env.RATE_LIMIT_STORE;
  delete process.env.RATE_LIMIT_REDIS_URL;
  delete process.env.RATE_LIMIT_REDIS_TOKEN;
  delete process.env.RATE_LIMIT_FAILURE_MODE;
  vi.unstubAllGlobals();
  resetRateLimitState();
});

describe("secondary API routes", () => {
  it("accepts one feedback submission and rejects a duplicate with request IDs", async () => {
    const body = { generationRequestId: "generation-1234", helpful: true, taskType: "project_planning" };
    const first = await feedback(request("http://localhost/api/feedback", body));
    const second = await feedback(request("http://localhost/api/feedback", body));
    expect(first.status).toBe(200);
    expect((await first.json()).requestId).toMatch(/-/);
    expect(second.status).toBe(409);
    expect((await second.json()).requestId).toMatch(/-/);
  });

  it("rejects unknown analytics fields and accepts whitelisted copy events", async () => {
    const invalid = await events(request("http://localhost/api/events", { event: "prompt_copied", requestId: "generation-1234", promptMode: "expert", input: "private" }));
    const valid = await events(request("http://localhost/api/events", { event: "prompt_copied", requestId: "generation-1234", promptMode: "expert" }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).requestId).toMatch(/-/);
    expect(valid.status).toBe(200);
  });

  it("returns a safe health response with a request ID", async () => {
    const response = health();
    const body = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.requestId).toMatch(/-/);
    expect(body).not.toHaveProperty("DEEPSEEK_API_KEY");
    expect(body).not.toHaveProperty("RATE_LIMIT_REDIS_TOKEN");
  });

  it("returns 503 without generating when Redis deny mode is unavailable", async () => {
    process.env.RATE_LIMIT_STORE = "redis";
    process.env.RATE_LIMIT_REDIS_URL = "https://redis.example";
    process.env.RATE_LIMIT_REDIS_TOKEN = "test-token";
    process.env.RATE_LIMIT_FAILURE_MODE = "deny";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const response = await generate(request("http://localhost/api/generate", { input: "帮我写一个挑战杯项目计划书" }));
    expect(response.status).toBe(503);
    expect((await response.json()).requestId).toMatch(/-/);
  });
});
