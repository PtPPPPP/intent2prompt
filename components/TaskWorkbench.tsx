"use client";

import { useEffect, useRef, useState } from "react";
import { getAnonymousClientId } from "@/lib/anonymousClientId";
import { inspectStructure } from "@/lib/promptEvaluator";
import { buildProtectedContext, checkProtectedContent, REVIEW_NOTICE } from "@/lib/optimizationGuard";
import { adoptVersion, appendVersion, compareLines, MAX_FEEDBACK_LENGTH, MAX_PROMPT_LENGTH, MAX_VERSIONS, sourceLabel, workspaceMarkdown, type ModelSource, type Workspace } from "@/lib/workbench";

const button = "rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50";

export function TaskWorkbench({ workspace, onChange, onSave }: { workspace: Workspace; onChange: (workspace: Workspace) => void; onSave: () => void }) {
  const [artifactId, setArtifactId] = useState(workspace.result.package.recommendedArtifactId);
  const [comparisonId, setComparisonId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [capability, setCapability] = useState<{ available: boolean; message: string }>({ available: false, message: "正在检查服务端模型配置…" });
  const inFlight = useRef(false);
  const artifact = workspace.result.package.artifacts.find((a) => a.id === artifactId)!;
  const versions = workspace.versions.filter((v) => v.artifactId === artifactId);
  const selected = versions.find((v) => v.id === workspace.selected[artifactId])!;
  const original = versions[0];
  const draft = workspace.drafts[artifactId] ?? selected.content;
  const feedback = workspace.feedback[artifactId] ?? "";
  const compare = versions.find((v) => v.id === comparisonId) ?? original;
  const diff = compareLines(compare.content, selected.content);
  const structure = inspectStructure(draft);
  const canOptimize = capability.available;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/optimize", { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || typeof data.available !== "boolean" || typeof data.message !== "string") throw new Error();
      setCapability({ available: data.available, message: data.message });
    }).catch(() => { if (!controller.signal.aborted) setCapability({ available: false, message: "暂时无法确认模型配置。可继续编辑、比较、保存和导出；刷新后重试。" }); });
    return () => controller.abort();
  }, []);

  function updateDraft(value: string) { onChange({ ...workspace, drafts: { ...workspace.drafts, [artifactId]: value } }); }
  function snapshot(): Workspace {
    return draft === selected.content ? workspace : appendVersion(workspace, artifactId, draft, { kind: "manual" }, "用户手动编辑", [REVIEW_NOTICE]);
  }
  function saveEdit() {
    try { const next = snapshot(); onChange(next); setMessage(next === workspace ? "内容未改变。" : "已保留编辑版本；比较后可选择采用。请保存工作台以便刷新恢复。"); }
    catch (error) { setMessage((error as Error).message); }
  }
  async function optimize() {
    if (inFlight.current) return;
    if (!feedback.trim()) { setMessage("请先输入优化反馈。"); return; }
    if (!draft.trim()) { setMessage("指令不能为空。"); return; }
    if (workspace.versions.length + (draft === selected.content ? 1 : 2) > MAX_VERSIONS) { setMessage("版本已达上限，请先导出并创建新任务。"); return; }
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      // 捕获用户选中的内容，编辑稿成为候选版本的父版本，不覆盖任何原稿。
      const base = snapshot();
      onChange(base);
      const response = await fetch("/api/optimize", {
        method: "POST", headers: { "Content-Type": "application/json", "x-anonymous-client-id": getAnonymousClientId() },
        body: JSON.stringify({ content: draft, original: original.content, feedback, goal: workspace.result.originalInput, targetTools: artifact.targetTool ? [artifact.targetTool] : workspace.result.package.targetTools }),
        signal: AbortSignal.timeout(65000),
      });
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("优化接口返回异常，请重试。");
      const result = data as { content?: unknown; source?: ModelSource; warnings?: unknown; requestId?: string; message?: string; retryAfter?: number };
      if (!response.ok) throw new Error(`${result.message ?? "优化失败，请重试。"}${response.status === 429 ? ` 请 ${result.retryAfter ?? 60} 秒后重试。` : ""}${result.requestId ? ` 请求编号：${result.requestId}` : ""}`);
      if (typeof result.content !== "string" || !result.content.trim() || result.content.length > MAX_PROMPT_LENGTH || result.source?.kind !== "model" || typeof result.source.provider !== "string" || !Array.isArray(result.warnings) || !result.warnings.every((v) => typeof v === "string")) throw new Error("优化接口返回异常，请重试。");
      onChange(appendVersion(base, artifactId, result.content, result.source, feedback, result.warnings));
      setMessage(`新版本已保留，尚未采用。请展开比较并人工核查。 请求编号：${result.requestId ?? "未知"}`);
    } catch (error) { setMessage(`${error instanceof Error ? error.message : "优化失败。"} 原稿、编辑内容和反馈已保留。`); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(selected.content); setMessage("已复制当前查看版本。"); }
    catch { setMessage("复制失败，请选择文本手动复制或导出。"); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([workspaceMarkdown(workspace)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "Intent2Prompt-工作台.md"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const missingProtected = checkProtectedContent(draft, buildProtectedContext(workspace.result.originalInput, workspace.result.package.targetTools, original.content, selected.content));

  return <section className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft">
    <h2 className="text-xl font-semibold">编辑与优化工作台</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">编辑 → 按反馈优化 → 比较 → 选择采用 → 保存。上方任务包始终展示已采用版本；新版本不会自动覆盖。</p>
    <label className="mt-4 block text-sm font-medium">选择待编辑指令
      <select aria-label="选择待编辑指令" value={artifactId} disabled={busy} onChange={(e) => { setArtifactId(e.target.value); setComparisonId(""); setMessage(""); }} className="mt-1 block w-full rounded-md border border-line p-2">
        {workspace.result.package.artifacts.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
      </select>
    </label>
    <p className="mt-2 break-words text-xs text-slate-500">目标工具：{artifact.targetTool ?? workspace.result.package.targetTools.join("、")} · 版本来源：{sourceLabel(selected.source)}</p>
    <label className="mt-4 block text-sm font-medium">编辑所选指令
      <textarea aria-label="编辑所选指令" value={draft} maxLength={MAX_PROMPT_LENGTH} disabled={busy} onChange={(e) => updateDraft(e.target.value)} className="mt-2 min-h-64 w-full resize-y rounded-md border border-line p-3 text-sm leading-6" />
    </label>
    <p className="text-right text-xs text-slate-500">{draft.length} / {MAX_PROMPT_LENGTH} · {workspace.versions.length} / {MAX_VERSIONS} 个版本</p>
    <button className={button + " mt-2"} disabled={busy} onClick={saveEdit}>保留编辑为新版本</button>
    <label className="mt-4 block text-sm font-medium">优化反馈
      <textarea aria-label="优化反馈" value={feedback} maxLength={MAX_FEEDBACK_LENGTH} disabled={busy} onChange={(e) => onChange({ ...workspace, feedback: { ...workspace.feedback, [artifactId]: e.target.value } })} placeholder="例如：更简洁，补充可核查的验收标准；保留明确约束" className="mt-2 min-h-20 w-full rounded-md border border-line p-3 text-sm" />
    </label>
    <p className="mt-2 text-sm text-slate-500">{capability.message}</p>
    <button className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || !canOptimize} onClick={optimize}>{busy ? "正在优化..." : "按反馈优化一次"}</button>
    {message ? <p role="status" className="mt-3 break-words rounded-md bg-cloud p-3 text-sm">{message}</p> : null}
    {missingProtected.length ? <p className="mt-3 text-sm text-amber-800">待核查：当前编辑稿可能缺少 {missingProtected.length} 条受保护原文，模型优化会拒绝处理；可手动保留版本并比较。</p> : null}
    <details className="mt-5 rounded-md border border-line p-3">
      <summary className="cursor-pointer font-medium">版本与比较（{versions.length}）</summary>
      <label className="mt-3 block text-sm">查看版本
        <select aria-label="查看版本" disabled={busy || draft !== selected.content} value={selected.id} onChange={(e) => { onChange({ ...workspace, selected: { ...workspace.selected, [artifactId]: e.target.value } }); setMessage(""); }} className="mt-1 w-full rounded-md border border-line p-2">
          {versions.map((v, index) => <option key={v.id} value={v.id}>V{index + 1}{v.parentId === null ? " 原稿" : ""}{workspace.adopted[artifactId] === v.id ? " · 已采用" : ""} · {sourceLabel(v.source)}</option>)}
        </select>
      </label>
      {draft !== selected.content ? <p className="mt-1 text-xs text-amber-800">切换版本前请保留编辑，避免丢失输入。</p> : null}
      <p className="mt-2 break-words text-xs text-slate-500">{selected.createdAt} · 父版本：{selected.parentId ? `V${versions.findIndex((v) => v.id === selected.parentId) + 1}` : "无（原稿）"} · 反馈：{selected.feedback || "无"}</p>
      <label className="mt-3 block text-sm">比较基准
        <select aria-label="比较基准" value={compare.id} disabled={busy} onChange={(e) => setComparisonId(e.target.value)} className="mt-1 w-full rounded-md border border-line p-2">{versions.map((v, i) => <option key={v.id} value={v.id}>V{i + 1}{i === 0 ? " 原稿" : ""}</option>)}</select>
      </label>
      <p className="mt-3 text-sm">改动摘要：{diff.unchanged ? "内容相同" : !diff.removed.length && !diff.added.length ? "仅顺序或空白变化" : `删除/改写 ${diff.removed.length} 行，新增/改写 ${diff.added.length} 行`}。增删行数不代表效果提升。</p>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
        <div className="min-w-0"><p className="text-sm font-medium">基准版本</p><pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-cloud p-3 text-xs leading-6">{compare.content}</pre></div>
        <div className="min-w-0"><p className="text-sm font-medium">当前查看版本</p><pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-cloud p-3 text-xs leading-6">{selected.content}</pre></div>
      </div>
      <details className="mt-3"><summary className="cursor-pointer text-sm">展开增删原文</summary><ul className="mt-2 break-words text-xs leading-6">{diff.removed.map((line, i) => <li className="text-red-700" key={`r${i}`}>− {line}</li>)}{diff.added.map((line, i) => <li className="text-green-800" key={`a${i}`}>＋ {line}</li>)}</ul></details>
      <p className="mt-3 text-xs text-amber-800">{REVIEW_NOTICE}</p>
      {selected.warnings.map((warning) => <p key={warning} className="mt-1 text-xs text-amber-800">{warning}</p>)}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={button} disabled={busy || draft !== selected.content} onClick={() => { onChange(adoptVersion(workspace, artifactId, selected.id)); setMessage("已采用此版本。请保存工作台以便刷新恢复。"); }}>采用当前查看版本</button>
        <button className={button} onClick={copy}>复制查看版本</button>
      </div>
    </details>
    <details className="mt-3 rounded-md border border-line p-3">
      <summary className="cursor-pointer font-medium">结构检查（当前编辑内容）</summary>
      <p className="mt-2 text-sm text-slate-500">仅检测文字线索，不验证语义、事实、可执行效果，也不决定版本优劣。未调用模型评审。</p>
      <p className="mt-2 text-sm">检测到：{structure.present.join("、") || "无"}</p>
      <ul className="mt-2 list-inside list-disc text-sm text-amber-800">{(structure.issues.length ? structure.issues : ["未发现结构缺项；仍需人工核查内容。"]).map((issue) => <li key={issue}>{issue}</li>)}</ul>
    </details>
    <div className="mt-4 flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={onSave}>保存工作台到本地</button><button className={button} onClick={download}>导出工作台 Markdown</button></div>
    <p className="mt-2 text-xs leading-5 text-slate-500">保存包含全部版本、采用状态、编辑稿和反馈。最近 6 个任务保存在此浏览器，总容量上限约 200 万字符；保存第 7 个任务会替换最早记录，请提前导出。</p>
  </section>;
}
