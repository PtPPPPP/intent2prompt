import { recordAnalytics } from "@/lib/analytics";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { createRequestId, getAnonymousClientKey } from "@/lib/clientIdentity";
import { getEnv } from "@/lib/env";
import { checkRateLimit, RateLimitStoreUnavailableError } from "@/lib/rateLimit";
import type { PromptMode, TaskType } from "@/lib/types";

const submittedFeedback = new Set<string>();
const taskTypes = new Set<TaskType>(["project_planning", "club_operation", "writing", "academic_paper", "coding", "data_analysis", "survey", "learning", "presentation", "business_plan", "other"]);
const promptModes = new Set<PromptMode>(["concise", "expert", "competition"]);
const allowedKeys = new Set(["generationRequestId", "requestId", "helpful", "reason", "taskType", "selectedPromptMode"]);
const requestIdPattern = /^[a-zA-Z0-9-]{8,64}$/;

function generationRequestId(body: Record<string, unknown>): string | undefined {
  const value = body.generationRequestId ?? body.requestId;
  return typeof value === "string" && requestIdPattern.test(value) ? value : undefined;
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const generationId = body ? generationRequestId(body) : undefined;
  if (!body || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.has(key)) || !generationId || typeof body.helpful !== "boolean" || (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > getEnv().feedbackMaxLength)) || (body.taskType !== undefined && (!taskTypes.has(body.taskType as TaskType))) || (body.selectedPromptMode !== undefined && (!promptModes.has(body.selectedPromptMode as PromptMode)))) {
    return apiError(400, "Invalid feedback", "反馈内容不符合要求。", requestId);
  }
  try {
    const clientKey = getAnonymousClientKey(request);
    const limit = await checkRateLimit("feedback", clientKey);
    if (!limit.allowed) return apiError(429, "Rate limit exceeded", "请求过于频繁，请稍后再试。", requestId, limit.retryAfter);
    const duplicateKey = `${clientKey}:${generationId}`;
    if (submittedFeedback.has(duplicateKey)) return apiError(409, "Feedback already submitted", "该结果已经提交过反馈。", requestId);
    submittedFeedback.add(duplicateKey);
    await recordAnalytics({ event: "feedback_submitted", requestId: generationId, taskType: body.taskType as TaskType | undefined, promptMode: body.selectedPromptMode as PromptMode | undefined });
    return apiSuccess({ ok: true }, requestId);
  } catch (error) {
    if (error instanceof RateLimitStoreUnavailableError) return apiError(503, "Service unavailable", "请求保护服务暂时不可用，请稍后重试。", requestId);
    return apiError(500, "Feedback failed", "反馈服务暂时不可用，请稍后重试。", requestId);
  }
}
