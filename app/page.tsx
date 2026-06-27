"use client";

import { useState, useSyncExternalStore } from "react";
import { ClarifyingQuestions } from "@/components/ClarifyingQuestions";
import { EvaluationCard } from "@/components/EvaluationCard";
import { HistoryPanel } from "@/components/HistoryPanel";
import { IntentAnalysisCard } from "@/components/IntentAnalysisCard";
import { IntentInput } from "@/components/IntentInput";
import { PromptVersionCard } from "@/components/PromptVersionCard";
import { exampleIntents } from "@/data/examples";
import type { GeneratePromptResult } from "@/lib/types";

interface HistoryItem {
  input: string;
  createdAt: string;
}

const historyKey = "intent2prompt-history-v1";
const historyEvent = "intent2prompt-history-change";
const emptyHistory: HistoryItem[] = [];
let cachedHistoryRaw: string | null = null;
let cachedHistory: HistoryItem[] = emptyHistory;

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return emptyHistory;
  }

  const rawHistory = window.localStorage.getItem(historyKey);
  if (!rawHistory) {
    cachedHistoryRaw = null;
    cachedHistory = emptyHistory;
    return cachedHistory;
  }

  if (rawHistory === cachedHistoryRaw) {
    return cachedHistory;
  }

  try {
    cachedHistoryRaw = rawHistory;
    cachedHistory = JSON.parse(rawHistory) as HistoryItem[];
    return cachedHistory;
  } catch {
    window.localStorage.removeItem(historyKey);
    cachedHistoryRaw = null;
    cachedHistory = emptyHistory;
    return cachedHistory;
  }
}

function subscribeToHistory(onStoreChange: () => void) {
  window.addEventListener(historyEvent, onStoreChange);
  return () => window.removeEventListener(historyEvent, onStoreChange);
}

function writeHistory(history: HistoryItem[]) {
  window.localStorage.setItem(historyKey, JSON.stringify(history));
  window.dispatchEvent(new Event(historyEvent));
}

export default function Home() {
  const [intent, setIntent] = useState(exampleIntents[0]);
  const [result, setResult] = useState<GeneratePromptResult | null>(null);
  const history = useSyncExternalStore(subscribeToHistory, readHistory, () => emptyHistory);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: trimmedIntent }),
      });
      const data = (await response.json()) as GeneratePromptResult | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "生成失败。");
      }

      setResult(data);
      saveHistory(trimmedIntent);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    window.localStorage.removeItem(historyKey);
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
                <IntentAnalysisCard analysis={result.analysis} />
                <ClarifyingQuestions questions={result.clarifyingQuestions} />
                <EvaluationCard evaluation={result.evaluation} />
                <section className="grid gap-5">
                  {result.promptVersions.map((version) => (
                    <PromptVersionCard key={version.mode} version={version} />
                  ))}
                </section>
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
