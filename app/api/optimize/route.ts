import { apiError, apiSuccess } from "@/lib/apiResponse";
import { createRequestId, getAnonymousClientKey } from "@/lib/clientIdentity";
import { logRequest } from "@/lib/logger";
import { optimizeSelectedPrompt, OptimizationError, optimizationCapability } from "@/lib/llmClient";
import { buildProtectedContext } from "@/lib/optimizationGuard";
import { checkRateLimit, RateLimitStoreUnavailableError } from "@/lib/rateLimit";
import { MAX_FEEDBACK_LENGTH, MAX_PROMPT_LENGTH } from "@/lib/workbench";

export function GET() { return apiSuccess(optimizationCapability(), createRequestId()); }

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  let inputLength: number | undefined;
  const respond = (status: number, error: string, message: string, retryAfter?: number) => {
    logRequest({ requestId, route: "/api/optimize", status, durationMs: Date.now() - startedAt, inputLength, errorCode: error });
    return apiError(status, error, message, requestId, retryAfter);
  };
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond(400, "invalid_input", "请求必须为 JSON 对象。");
    const data = body as Record<string, unknown>;
    const validText = (key: string, max: number) => typeof data[key] === "string" && data[key].trim().length > 0 && data[key].length <= max;
    const tools = ["general", "chatgpt", "claude", "codex", "claude_code", "gemini", "image_generation"];
    if (!validText("content", MAX_PROMPT_LENGTH) || !validText("original", MAX_PROMPT_LENGTH) || !validText("feedback", MAX_FEEDBACK_LENGTH) || !validText("goal", 1000) || !Array.isArray(data.targetTools) || !data.targetTools.length || data.targetTools.length > 7 || data.targetTools.some((tool) => typeof tool !== "string" || !tools.includes(tool))) {
      return respond(400, "invalid_input", "指令/原稿须为 1–20000 字，反馈 1–1000 字，目标 1–1000 字，并提供有效目标工具。");
    }
    inputLength = (data.content as string).length;
    // 与生成共用额度，避免通过不同端点绕过付费调用保护。
    const limit = await checkRateLimit("generate", getAnonymousClientKey(request));
    if (!limit.allowed) return respond(429, "rate_limit_exceeded", "请求过于频繁，请稍后再试。", limit.retryAfter);
    const context = buildProtectedContext(data.goal as string, data.targetTools as string[], data.original as string, data.content as string);
    const result = await optimizeSelectedPrompt(data.content as string, data.feedback as string, context);
    logRequest({ requestId, route: "/api/optimize", status: 200, durationMs: Date.now() - startedAt, inputLength, providerStatus: "deepseek" });
    return apiSuccess(result, requestId);
  } catch (error) {
    if (error instanceof RateLimitStoreUnavailableError) return respond(503, "rate_limit_unavailable", "请求保护服务暂时不可用，请稍后重试。");
    if (error instanceof OptimizationError) return respond(error.code === "timeout" ? 504 : error.code === "unavailable" ? 503 : error.code === "constraint_loss" ? 422 : 502, error.code, error.message);
    return respond(500, "optimization_failed", "优化服务暂时不可用，原稿和输入已保留，请重试。");
  }
}
