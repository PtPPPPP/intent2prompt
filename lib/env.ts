export type RateLimitFailureMode = "fallback-memory" | "deny";

function booleanValue(value: string | undefined, fallback: boolean): boolean {
  return value === "true" ? true : value === "false" ? false : fallback;
}

function numberValue(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? Math.floor(parsed) : fallback;
}

export function getEnv() {
  const rateLimitStore = process.env.RATE_LIMIT_STORE === "redis" ? "redis" as const : "memory" as const;
  return {
    appVersion: process.env.APP_VERSION ?? "0.4.1",
    llmProvider: process.env.LLM_PROVIDER ?? "mock",
    llmEnabled: booleanValue(process.env.LLM_ENABLED, true),
    llmForceRuleMode: booleanValue(process.env.LLM_FORCE_RULE_MODE, false),
    llmTimeoutMs: numberValue(process.env.LLM_TIMEOUT_MS, 15_000, 1_000, 60_000),
    llmMaxRetries: numberValue(process.env.LLM_MAX_RETRIES, 1, 0, 2),
    rateLimitStore,
    rateLimitPerMinute: numberValue(process.env.RATE_LIMIT_PER_MINUTE, 5, 1, 100),
    rateLimitPerDay: numberValue(process.env.RATE_LIMIT_PER_DAY, 50, 1, 10_000),
    rateLimitRedisUrl: process.env.RATE_LIMIT_REDIS_URL,
    rateLimitRedisToken: process.env.RATE_LIMIT_REDIS_TOKEN,
    rateLimitRedisTimeoutMs: numberValue(process.env.RATE_LIMIT_REDIS_TIMEOUT_MS, 3_000, 100, 30_000),
    rateLimitFailureMode: process.env.RATE_LIMIT_FAILURE_MODE === "deny" ? "deny" as const : "fallback-memory" as const,
    anonymizationSalt: process.env.ANONYMIZATION_SALT,
    feedbackMaxLength: numberValue(process.env.FEEDBACK_MAX_LENGTH, 300, 1, 1_000),
  };
}

let productionMemoryWarningShown = false;
let missingSaltWarningShown = false;

export function warnAboutRuntimeConfiguration(): void {
  const env = getEnv();
  if (process.env.NODE_ENV === "production" && env.rateLimitStore === "memory" && !productionMemoryWarningShown) {
    productionMemoryWarningShown = true;
    console.warn("Rate limiting uses memory storage in production and is not reliable across multiple instances.");
  }
  if (process.env.NODE_ENV === "production" && !env.anonymizationSalt && !missingSaltWarningShown) {
    missingSaltWarningShown = true;
    console.warn("ANONYMIZATION_SALT is not configured; anonymous client keys use a process-local fallback.");
  }
}
