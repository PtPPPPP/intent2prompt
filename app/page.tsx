"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ClarifyingQuestions } from "@/components/ClarifyingQuestions";
import { EvaluationCard } from "@/components/EvaluationCard";
import { HistoryPanel } from "@/components/HistoryPanel";
import { IntentAnalysisCard } from "@/components/IntentAnalysisCard";
import { IntentInput } from "@/components/IntentInput";
import { PromptVersionCard } from "@/components/PromptVersionCard";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { exampleIntents } from "@/data/examples";
import { historyEvent, historyKey, parseHistory, type HistoryItem } from "@/lib/history";
import type { GeneratePromptResult } from "@/lib/types";

const emptyHistory: HistoryItem[] = [];
const DUPLICATE_SUBMISSION_WINDOW_MS = 3_000;
const anonymousClientKey = "intent2prompt-anonymous-client-id";
let cachedHistoryRaw: string | null = null;
let cachedHistory: HistoryItem[] = emptyHistory;

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return emptyHistory;
  }

  let rawHistory: string | null;
  try { rawHistory = window.localStorage.getItem(historyKey); } catch { return emptyHistory; }
  if (!rawHistory) {
    cachedHistoryRaw = null;
    cachedHistory = emptyHistory;
    return cachedHistory;
  }

  if (rawHistory === cachedHistoryRaw) {
    return cachedHistory;
  }

  const parsedHistory = parseHistory(rawHistory);
  if (!parsedHistory.length && rawHistory !== "[]") {
    window.localStorage.removeItem(historyKey);
  }

  cachedHistoryRaw = rawHistory;
  cachedHistory = parsedHistory;
  return cachedHistory;
}

function subscribeToHistory(onStoreChange: () => void) {
  window.addEventListener(historyEvent, onStoreChange);
  return () => window.removeEventListener(historyEvent, onStoreChange);
}

function writeHistory(history: HistoryItem[]) {
  try { window.localStorage.setItem(historyKey, JSON.stringify(history)); } catch { return; }
  window.dispatchEvent(new Event(historyEvent));
}

function getAnonymousClientId(): string {
  try {
    const existing = window.localStorage.getItem(anonymousClientKey);
    if (existing) return existing;
  } catch { return crypto.randomUUID(); }
  const id = crypto.randomUUID();
  try { window.localStorage.setItem(anonymousClientKey, id); } catch { return id; }
  return id;
}

export default function Home() {
  const [intent, setIntent] = useState(exampleIntents[0]);
  const [result, setResult] = useState<GeneratePromptResult | null>(null);
  const history = useSyncExternalStore(subscribeToHistory, readHistory, () => emptyHistory);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestInFlightRef = useRef(false);
  const lastCompletedSubmissionRef = useRef<{ input: string; completedAt: number } | null>(null);

  function saveHistory(input: string) {
    const nextHistory = [
      { input, createdAt: new Date().toLocaleString("zh-CN") },
      ...history.filter((item) => item.input !== input),
    ].slice(0, 6);

    writeHistory(nextHistory);
  }

  async function handleGenerate() {
    const trimmedIntent = intent.trim();

    if (!trimmedIntent) {
      setError("请输入一句中文意图。");
      return;
    }

    if (requestInFlightRef.current) {
      return;
    }

    const lastSubmission = lastCompletedSubmissionRef.current;
    if (
      lastSubmission?.input === trimmedIntent &&
      Date.now() - lastSubmission.completedAt < DUPLICATE_SUBMISSION_WINDOW_MS
    ) {
      setError("相同内容刚刚生成过，请稍后再试。");
      return;
    }

    setError("");
    requestInFlightRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anonymous-client-id": getAnonymousClientId(),
        },
        body: JSON.stringify({ input: trimmedIntent }),
      });
      const data = (await response.json()) as GeneratePromptResult | { error: string; message?: string; requestId?: string; retryAfter?: number };

      if (!response.ok || "error" in data) {
        if ("error" in data && response.status === 429) throw new Error(`请求过于频繁，请 ${data.retryAfter ?? 0} 秒后再试。${data.requestId ? ` 请求编号：${data.requestId}` : ""}`);
        if ("error" in data && response.status === 503) throw new Error(`服务暂时不可用，请稍后重试。${data.requestId ? ` 请求编号：${data.requestId}` : ""}`);
        throw new Error("error" in data ? `${data.message ?? data.error}${data.requestId ? ` 请求编号：${data.requestId}` : ""}` : "生成失败。");
      }

      setResult(data);
      saveHistory(trimmedIntent);
      lastCompletedSubmissionRef.current = { input: trimmedIntent, completedAt: Date.now() };
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "生成失败。");
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  }

  function clearHistory() {
    try { window.localStorage.removeItem(historyKey); } catch { return; }
    window.dispatchEvent(new Event(historyEvent));
  }

  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-normal text-ink md:text-4xl">
            Intent2Prompt
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            中文意图到结构化 Prompt 的生成器。输入一句简单想法，系统会解析任务、补全关键缺口，并生成可复制的三版 Prompt。
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <IntentInput
              value={intent}
              examples={exampleIntents}
              isLoading={isLoading}
              onChange={setIntent}
              onExampleClick={setIntent}
              onSubmit={handleGenerate}
            />

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {result ? (
              <>
                <div
                  className={`rounded-lg border p-4 text-sm ${
                    result.providerStatus === "deepseek"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : result.providerStatus === "fallback"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {result.providerStatus === "deepseek"
                    ? "当前结果：DeepSeek 增强模式"
                    : result.providerStatus === "fallback"
                      ? "当前结果：已降级为规则模式"
                      : "当前结果：规则模式"}
                  {result.providerMessage ? `（${result.providerMessage}）` : ""}
                </div>
                <IntentAnalysisCard analysis={result.analysis} />
                <ClarifyingQuestions questions={result.clarifyingQuestions} />
                <EvaluationCard evaluation={result.evaluation} />
                <section className="grid gap-5">
                  {result.promptVersions.map((version) => (
                    <PromptVersionCard key={version.mode} version={version} />
                  ))}
                </section>
                <FeedbackPanel requestId={(result as GeneratePromptResult & { requestId: string }).requestId} taskType={result.analysis.taskType} />
              </>
            ) : (
              <section className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-slate-500">
                点击生成后，这里会展示意图解析、追问和三版 Prompt。
              </section>
            )}
          </div>

          <HistoryPanel
            history={history}
            onSelect={(input) => setIntent(input)}
            onClear={clearHistory}
          />
        </div>
      </div>
    </main>
  );
}
