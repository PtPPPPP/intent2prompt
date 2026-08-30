"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ClarifyingQuestions } from "@/components/ClarifyingQuestions";
import { EvaluationCard } from "@/components/EvaluationCard";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { IntentAnalysisCard } from "@/components/IntentAnalysisCard";
import { IntentInput } from "@/components/IntentInput";
import { PromptPackageCard } from "@/components/PromptPackageCard";
import { PromptVersionCard } from "@/components/PromptVersionCard";
import { exampleIntents } from "@/data/examples";
import { getAnonymousClientId } from "@/lib/anonymousClientId";
import { historyEvent, historyKey, parseHistory, type HistoryItem } from "@/lib/history";
import type { GeneratePromptResult, PromptPackageMode, TargetTool } from "@/lib/types";

const emptyHistory: HistoryItem[] = [];
const DUPLICATE_SUBMISSION_WINDOW_MS = 3_000;
let cachedHistoryRaw: string | null = null;
let cachedHistory: HistoryItem[] = emptyHistory;

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return emptyHistory;
  let rawHistory: string | null;
  try { rawHistory = window.localStorage.getItem(historyKey); } catch { return emptyHistory; }
  if (!rawHistory) { cachedHistoryRaw = null; cachedHistory = emptyHistory; return cachedHistory; }
  if (rawHistory === cachedHistoryRaw) return cachedHistory;
  const parsedHistory = parseHistory(rawHistory);
  if (!parsedHistory.length && rawHistory !== "[]") window.localStorage.removeItem(historyKey);
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

export default function Home() {
  const [intent, setIntent] = useState(exampleIntents[0]);
  const [targetTool, setTargetTool] = useState<TargetTool>("auto");
  const [packageMode, setPackageMode] = useState<PromptPackageMode>("auto");
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GeneratePromptResult | null>(null);
  const history = useSyncExternalStore(subscribeToHistory, readHistory, () => emptyHistory);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestInFlightRef = useRef(false);
  const lastCompletedSubmissionRef = useRef<{ key: string; completedAt: number } | null>(null);

  function saveHistory(input: string) {
    writeHistory([{ input, createdAt: new Date().toLocaleString("zh-CN") }, ...history.filter((item) => item.input !== input)].slice(0, 6));
  }

  async function handleGenerate() {
    const trimmedIntent = intent.trim();
    if (!trimmedIntent) { setError("请输入一句中文意图。"); return; }
    if (requestInFlightRef.current) return;
    const lastSubmission = lastCompletedSubmissionRef.current;
    const submissionKey = JSON.stringify({ trimmedIntent, targetTool, packageMode, clarificationAnswers });
    if (lastSubmission?.key === submissionKey && Date.now() - lastSubmission.completedAt < DUPLICATE_SUBMISSION_WINDOW_MS) {
      setError("相同内容刚刚生成过，请稍后再试。");
      return;
    }

    setError("");
    requestInFlightRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anonymous-client-id": getAnonymousClientId() },
        body: JSON.stringify({ input: trimmedIntent, targetTool, packageMode, clarificationAnswers }),
      });
      const data = (await response.json()) as GeneratePromptResult | { error: string; message?: string; requestId?: string; retryAfter?: number };
      if (!response.ok || "error" in data) {
        if ("error" in data && response.status === 429) throw new Error(`请求过于频繁，请 ${data.retryAfter ?? 0} 秒后再试。${data.requestId ? ` 请求编号：${data.requestId}` : ""}`);
        if ("error" in data && response.status === 503) throw new Error(`服务暂时不可用，请稍后重试。${data.requestId ? ` 请求编号：${data.requestId}` : ""}`);
        throw new Error("error" in data ? `${data.message ?? data.error}${data.requestId ? ` 请求编号：${data.requestId}` : ""}` : "生成失败。");
      }
      setResult(data);
      setClarificationAnswers({});
      saveHistory(trimmedIntent);
      lastCompletedSubmissionRef.current = { key: submissionKey, completedAt: Date.now() };
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

  return <main className="min-h-screen bg-cloud">
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-normal text-ink md:text-4xl">Intent2Prompt</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">把一句简单想法整理成可直接发送给 AI 的任务指令；复杂任务会附带完整任务包。</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <IntentInput value={intent} examples={exampleIntents} isLoading={isLoading} targetTool={targetTool} onChange={setIntent} onTargetToolChange={setTargetTool} onExampleClick={setIntent} onSubmit={handleGenerate} />
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
          {result ? <>
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-sm font-medium text-accent">系统理解</p>
              <p className="mt-2 text-lg leading-8 text-ink">{result.package.summary}</p>
              <label className="mt-3 block max-w-xs text-sm font-medium text-slate-700">生成方式
                <select value={packageMode} onChange={(event) => setPackageMode(event.target.value as PromptPackageMode)} className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2">
                  <option value="auto">自动判断</option>
                  <option value="single_prompt">单任务 Prompt</option>
                  <option value="engineering_package">工程任务包</option>
                  <option value="multi_ai_package">多 AI 协作包</option>
                </select>
              </label>
              <button type="button" onClick={handleGenerate} disabled={isLoading} className="mt-3 rounded-md border border-accent px-3 py-2 text-sm font-medium text-accent disabled:cursor-not-allowed">按当前设置重新生成</button>
            </section>
            <ClarifyingQuestions questions={result.package.clarificationQuestions} answers={clarificationAnswers} isLoading={isLoading} onAnswerChange={(id, value) => setClarificationAnswers((current) => ({ ...current, [id]: value }))} onSubmit={handleGenerate} />
            <PromptPackageCard promptPackage={result.package} />
            <details className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">高级详情：意图分析、旧版 Prompt 与质量评分</summary>
              <div className="mt-5 space-y-5">
                <IntentAnalysisCard analysis={result.analysis} />
                <EvaluationCard evaluation={result.evaluation} />
                <section className="grid gap-5">{result.promptVersions.map((version) => <PromptVersionCard key={version.mode} version={version} />)}</section>
                <p className="text-sm text-slate-500">生成模式：{result.providerStatus}{result.providerMessage ? `（${result.providerMessage}）` : ""}</p>
              </div>
            </details>
            <FeedbackPanel requestId={(result as GeneratePromptResult & { requestId: string }).requestId} taskType={result.analysis.taskType} />
          </> : <section className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-slate-500">点击生成后，这里会先展示推荐任务指令；复杂任务会附带可复制的任务包。</section>}
        </div>
        <HistoryPanel history={history} onSelect={setIntent} onClear={clearHistory} />
      </div>
    </div>
  </main>;
}
