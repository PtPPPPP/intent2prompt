import { recordAnalytics, type AnalyticsEventType } from "@/lib/analytics";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { createRequestId } from "@/lib/clientIdentity";
import type { PromptMode } from "@/lib/types";

const events = new Set<AnalyticsEventType>(["prompt_copied"]);
const promptModes = new Set<PromptMode>(["concise", "expert", "competition"]);
const allowedKeys = new Set(["event", "requestId", "promptMode"]);

export async function POST(request: Request) {
  const responseRequestId = createRequestId();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.has(key)) || typeof body.event !== "string" || !events.has(body.event as AnalyticsEventType) || typeof body.requestId !== "string" || !/^[a-zA-Z0-9-]{8,64}$/.test(body.requestId) || typeof body.promptMode !== "string" || !promptModes.has(body.promptMode as PromptMode)) {
    return apiError(400, "Invalid event", "事件内容不符合要求。", responseRequestId);
  }
  try {
    await recordAnalytics({ event: body.event as AnalyticsEventType, requestId: body.requestId, promptMode: body.promptMode as PromptMode });
    return apiSuccess({ ok: true }, responseRequestId);
  } catch {
    return apiError(500, "Event failed", "事件记录暂时不可用，请稍后重试。", responseRequestId);
  }
}
