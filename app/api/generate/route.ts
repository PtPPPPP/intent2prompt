import { recordAnalytics } from "@/lib/analytics";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { createRequestId, getAnonymousClientKey } from "@/lib/clientIdentity";
import { generatePromptPackage } from "@/lib/intentAnalyzer";
import { logRequest } from "@/lib/logger";
import { checkRateLimit, RateLimitStoreUnavailableError } from "@/lib/rateLimit";

interface GenerateRequestBody { input?: unknown; intent?: unknown }
const MAX_INPUT_LENGTH = 1000;

function extractInput(body: GenerateRequestBody): { value?: string; message?: string } {
  const field = "input" in body ? "input" : "intent" in body ? "intent" : undefined;
  if (!field) return { message: "input must be provided" };
  const value = body[field];
  if (typeof value !== "string") return { message: `${field} must be a string` };
  const input = value.trim();
  if (!input) return { message: `${field} must be a non-empty string` };
  if (input.length > MAX_INPUT_LENGTH) return { message: `${field} must be no longer than ${MAX_INPUT_LENGTH} characters` };
  return { value: input };
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  let inputLength: number | undefined;
  try {
    const body: unknown = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Invalid request body", "request body must be valid JSON", requestId);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError(400, "Invalid request body", "request body must be a JSON object", requestId);
    }
    const requestBody = body as GenerateRequestBody;
    const input = extractInput(requestBody);
    inputLength = typeof requestBody.input === "string" ? requestBody.input.length : undefined;
    if (!input.value) {
      return apiError(400, "Invalid request body", input.message ?? "Invalid input", requestId);
    }

    const limit = await checkRateLimit("generate", getAnonymousClientKey(request));
    if (!limit.allowed) {
      await recordAnalytics({ event: "generation_failed", requestId, durationMs: Date.now() - startedAt });
      return apiError(429, "Rate limit exceeded", "请求过于频繁，请稍后再试。", requestId, limit.retryAfter);
    }

    const result = await generatePromptPackage(input.value);
    await recordAnalytics({ event: "generation_completed", requestId, providerStatus: result.providerStatus, taskType: result.analysis.taskType, durationMs: Date.now() - startedAt });
    logRequest({ requestId, route: "/api/generate", status: 200, durationMs: Date.now() - startedAt, providerStatus: result.providerStatus, inputLength, taskType: result.analysis.taskType });
    return apiSuccess(result, requestId);
  } catch (error) {
    if (error instanceof RateLimitStoreUnavailableError) {
      logRequest({ requestId, route: "/api/generate", status: 503, durationMs: Date.now() - startedAt, inputLength, errorCode: "rate_limit_unavailable" });
      return apiError(503, "Service unavailable", "请求保护服务暂时不可用，请稍后重试。", requestId);
    }
    await recordAnalytics({ event: "generation_failed", requestId, durationMs: Date.now() - startedAt });
    logRequest({ requestId, route: "/api/generate", status: 500, durationMs: Date.now() - startedAt, inputLength, errorCode: "generation_failed" });
    return apiError(500, "Generation failed", "生成服务暂时不可用，请稍后重试。", requestId);
  }
}
