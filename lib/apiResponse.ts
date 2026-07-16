import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  message: string;
  requestId: string;
  retryAfter?: number;
}

export function apiSuccess(body: object, requestId: string, status = 200): NextResponse {
  return NextResponse.json({ ...body, requestId }, { status });
}

export function apiError(
  status: number,
  error: string,
  message: string,
  requestId: string,
  retryAfter?: number,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error, message, requestId, ...(retryAfter === undefined ? {} : { retryAfter }) };
  return NextResponse.json(body, {
    status,
    headers: retryAfter === undefined ? undefined : { "Retry-After": String(retryAfter) },
  });
}
