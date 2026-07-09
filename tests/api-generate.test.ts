import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/generate/route";

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
});
