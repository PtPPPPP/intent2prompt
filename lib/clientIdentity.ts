import { createHash, randomUUID } from "node:crypto";
import { getEnv, warnAboutRuntimeConfiguration } from "./env";

const ANONYMOUS_ID_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;

export function getAnonymousClientKey(request: Request): string {
  const suppliedId = request.headers.get("x-anonymous-client-id")?.trim();
  const identity = suppliedId && ANONYMOUS_ID_PATTERN.test(suppliedId) ? `client:${suppliedId}` : "anonymous";
  const salt = getEnv().anonymizationSalt ?? `local-${process.pid}`;
  warnAboutRuntimeConfiguration();
  return createHash("sha256").update(`${salt}:${identity}`).digest("hex");
}

export function createRequestId(): string {
  return randomUUID();
}
