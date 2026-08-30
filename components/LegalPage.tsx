import type { ReactNode } from "react";

// 法务页面共用容器：商用上线前需把【待补充】的主体信息补齐，
// 并核对条款与实际数据处理流程一致。
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-cloud">
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">更新日期：{updatedAt}</p>
        <div className="prose-sm mt-6 space-y-4 rounded-lg border border-line bg-white p-6 text-sm leading-6 text-slate-700 shadow-soft [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </article>
    </main>
  );
}
