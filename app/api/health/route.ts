import { apiSuccess } from "@/lib/apiResponse";
import { createRequestId } from "@/lib/clientIdentity";
import { getEnv } from "@/lib/env";
import { getRateLimitHealth } from "@/lib/rateLimit";

export function GET() {
  const env = getEnv();
  const rateLimit = getRateLimitHealth();
  const degraded = rateLimit.status !== "available" || (process.env.NODE_ENV === "production" && rateLimit.store === "memory");
  return apiSuccess({
    status: degraded ? "degraded" : "ok",
    version: env.appVersion,
    ruleEngine: "available",
    llmEnabled: env.llmEnabled && !env.llmForceRuleMode,
    providerConfigured: env.llmProvider === "deepseek" && Boolean(process.env.DEEPSEEK_API_KEY),
    rateLimitStore: rateLimit.store,
    rateLimitStatus: rateLimit.status,
    timestamp: new Date().toISOString(),
  }, createRequestId());
}
