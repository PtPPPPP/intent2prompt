import { NextResponse } from "next/server";
import { generatePromptPackage } from "@/lib/intentAnalyzer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: string; intent?: string };
    const intent = (body.input ?? body.intent)?.trim();

    if (!intent) {
      return NextResponse.json({ error: "请输入一句中文意图。" }, { status: 400 });
    }

    const result = await generatePromptPackage(intent);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
