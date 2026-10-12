"use client";

import { useState } from "react";
import type { PromptArtifact, PromptPackage } from "@/lib/types";

interface PromptPackageCardProps {
  promptPackage: PromptPackage;
}

function packageMarkdown(promptPackage: PromptPackage): string {
  return [`# ${promptPackage.title}`, "", promptPackage.summary, "", ...promptPackage.artifacts.flatMap((artifact) => [`## ${artifact.title}`, "", artifact.content, ""])].join("\n");
}

export function PromptPackageCard({ promptPackage }: PromptPackageCardProps) {
  const [openId, setOpenId] = useState(promptPackage.recommendedArtifactId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFailed(false);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 1800);
    }
  }

  function exportMarkdown() {
    const blob = new Blob([packageMarkdown(promptPackage)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${promptPackage.title}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const recommended = promptPackage.artifacts.find((artifact) => artifact.id === promptPackage.recommendedArtifactId);
  return (
    <section className="rounded-lg border border-accent bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-accent">推荐任务指令</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{promptPackage.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{promptPackage.summary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => recommended && copy("recommended", recommended.content)} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">{copyFailed ? "复制失败" : copiedId === "recommended" ? "已复制" : "复制推荐指令"}</button>
          <button type="button" onClick={exportMarkdown} className="rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700">导出 Markdown</button>
        </div>
      </div>

      {recommended ? <pre className="mt-5 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">{recommended.content}</pre> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => copy("all", packageMarkdown(promptPackage))} className="rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700">{copiedId === "all" ? "已复制" : "复制整个任务包"}</button>
        {promptPackage.usageInstructions.map((item) => <span key={item} className="rounded-md bg-cloud px-3 py-2 text-xs text-slate-600">{item}</span>)}
      </div>

      <div className="mt-6 space-y-2">
        {promptPackage.artifacts.filter((artifact) => artifact.id !== promptPackage.recommendedArtifactId).map((artifact) => (
          <ArtifactRow key={artifact.id} artifact={artifact} open={openId === artifact.id} copied={copiedId === artifact.id} onToggle={() => setOpenId(openId === artifact.id ? "" : artifact.id)} onCopy={() => copy(artifact.id, artifact.content)} />
        ))}
      </div>
    </section>
  );
}

function ArtifactRow({ artifact, open, copied, onToggle, onCopy }: { artifact: PromptArtifact; open: boolean; copied: boolean; onToggle: () => void; onCopy: () => void }) {
  return <article className="rounded-md border border-line">
    <div className="flex items-center justify-between gap-3 p-3">
      <button type="button" onClick={onToggle} className="text-left"><span className="font-medium">{artifact.title}</span><span className="ml-2 text-sm text-slate-500">{artifact.description}</span></button>
      <button type="button" onClick={onCopy} className="shrink-0 rounded border border-line px-2 py-1 text-sm text-slate-700">{copied ? "已复制" : "复制"}</button>
    </div>
    {open ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-line bg-slate-950 p-4 text-sm leading-6 text-slate-100">{artifact.content}</pre> : null}
  </article>;
}
