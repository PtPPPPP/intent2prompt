"use client";

import { useState } from "react";
import type { TaskType } from "@/lib/types";

export function FeedbackPanel({ requestId, taskType }: { requestId: string; taskType: TaskType }) {
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(helpful: boolean) {
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ generationRequestId: requestId, helpful, reason: reason || undefined, taskType }) });
      if (!response.ok) throw new Error();
      setState("done");
    } catch { setState("error"); }
  }
  return <section className="rounded-lg border border-line bg-white p-5 shadow-soft"><p className="font-semibold text-ink">这个结果有帮助吗？</p><p className="mt-1 text-sm text-slate-500">请勿填写个人隐私或敏感信息。</p><textarea value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} placeholder="可选：用一句话补充原因" className="mt-3 w-full rounded-md border border-line p-3 text-sm" /><div className="mt-3 flex gap-2"><button disabled={state === "sending" || state === "done"} onClick={() => submit(true)} className="rounded-md border px-3 py-2 text-sm">👍 有帮助</button><button disabled={state === "sending" || state === "done"} onClick={() => submit(false)} className="rounded-md border px-3 py-2 text-sm">👎 没帮助</button></div>{state === "done" ? <p className="mt-2 text-sm text-emerald-700">感谢反馈。</p> : null}{state === "error" ? <p className="mt-2 text-sm text-red-700">提交失败，请稍后重试。</p> : null}</section>;
}
