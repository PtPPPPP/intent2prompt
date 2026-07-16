import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/generate/route";
import { resetRateLimitState } from "@/lib/rateLimit";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

const originalProvider = process.env.LLM_PROVIDER;
const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY;

afterEach(() => {
  if (originalProvider === undefined) {
    delete process.env.LLM_PROVIDER;
  } else {
    process.env.LLM_PROVIDER = originalProvider;
  }

  if (originalDeepSeekKey === undefined) {
    delete process.env.DEEPSEEK_API_KEY;
  } else {
    process.env.DEEPSEEK_API_KEY = originalDeepSeekKey;
  }

  vi.unstubAllGlobals();
  resetRateLimitState();
});

describe("POST /api/generate", () => {
  it("accepts the recommended input parameter", async () => {
    const response = await POST(jsonRequest({ input: "帮我写一个挑战杯项目计划书" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.originalInput).toBe("帮我写一个挑战杯项目计划书");
    expect(data).toHaveProperty("analysis");
    expect(data).toHaveProperty("promptVersions");
    expect(data).toHaveProperty("evaluation");
  });

  it("keeps backward compatibility with intent", async () => {
    const response = await POST(jsonRequest({ intent: "帮我写一个社团招新文案" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.originalInput).toBe("帮我写一个社团招新文案");
  });

  it("prefers input when input and intent are both provided", async () => {
    const response = await POST(
      jsonRequest({
        input: "帮我总结一篇论文",
        intent: "帮我写一个挑战杯项目计划书",
      }),
    );
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.originalInput).toBe("帮我总结一篇论文");
  });

  it.each([
    [{ input: "" }, "input must be a non-empty string"],
    [{ input: "   " }, "input must be a non-empty string"],
    [123, "request body must be a JSON object"],
    [[], "request body must be a JSON object"],
    [{}, "input must be provided"],
    [{ input: 123 }, "input must be a string"],
    [{ intent: 123 }, "intent must be a string"],
    [{ input: "x".repeat(1001) }, "input must be no longer than 1000 characters"],
    [{ intent: "x".repeat(1001) }, "intent must be no longer than 1000 characters"],
  ])("returns 400 for invalid request body %j", async (body, message) => {
    const response = await POST(jsonRequest(body));
    const data = await readJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
    expect(data.message).toBe(message);
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
    );
    const data = await readJson(response);

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
    expect(data.message).toBe("request body must be valid JSON");
  });

  it("uses the rule-based flow in mock mode without calling a model", async () => {
    process.env.LLM_PROVIDER = "mock";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ input: "帮我设计一个问卷" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.providerStatus).toBe("mock");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the rule-based flow when DeepSeek is not configured", async () => {
    process.env.LLM_PROVIDER = "deepseek";
    delete process.env.DEEPSEEK_API_KEY;

    const response = await POST(jsonRequest({ input: "帮我设计一个问卷" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.providerStatus).toBe("fallback");
    expect(data.providerMessage).toContain("未配置");
  });

  it("falls back to the rule-based flow when DeepSeek returns an error", async () => {
    process.env.LLM_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));

    const response = await POST(jsonRequest({ input: "帮我设计一个问卷" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.providerStatus).toBe("fallback");
    expect(data.providerMessage).toContain("增强失败");
  });

  it("uses DeepSeek enhancement when a configured request succeeds", async () => {
    process.env.LLM_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "test-key";
    const enhancedPrompt = "润色后的 Prompt。".repeat(500);
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: enhancedPrompt } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(jsonRequest({ input: "帮我设计一个问卷" }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.providerStatus).toBe("deepseek");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
