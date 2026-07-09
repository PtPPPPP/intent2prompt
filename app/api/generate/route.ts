import { NextResponse } from "next/server";
import { generatePromptPackage } from "@/lib/intentAnalyzer";

interface GenerateRequestBody {
  input?: unknown;
  intent?: unknown;
}

function badRequest(message: string) {
  return NextResponse.json(
    {
      error: "Invalid request body",
      message,
    },
    { status: 400 },
  );
}

function isPlainRequestBody(value: unknown): value is GenerateRequestBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractIntent(body: GenerateRequestBody): { value?: string; message?: string } {
  if ("input" in body) {
    if (typeof body.input !== "string") {
      return { message: "input must be a string" };
    }

    const input = body.input.trim();
    return input ? { value: input } : { message: "input must be a non-empty string" };
  }

  if ("intent" in body) {
    if (typeof body.intent !== "string") {
      return { message: "intent must be a string" };
    }

    const intent = body.intent.trim();
    return intent ? { value: intent } : { message: "input must be a non-empty string" };
  }

  return { message: "input must be provided" };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("request body must be valid JSON");
  }

  if (!isPlainRequestBody(body)) {
    return badRequest("request body must be a JSON object");
  }

  const intent = extractIntent(body);
  if (!intent.value) {
    return badRequest(intent.message ?? "input must be a non-empty string");
  }

  try {
    const result = await generatePromptPackage(intent.value);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
