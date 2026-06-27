"use client";

import { useState } from "react";
import type { PromptVersion } from "@/lib/types";

interface PromptVersionCardProps {
  version: PromptVersion;
}

export function PromptVersionCard({ version }: PromptVersionCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(version.content);
      setCopyFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 1800);
    }
  }

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{version.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{version.description}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
        >
          {copyFailed ? "复制失败" : copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {version.content}
      </pre>
    </article>
  );
}
