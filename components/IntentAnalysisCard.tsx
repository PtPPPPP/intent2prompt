import { taskTypeLabels } from "@/lib/templates";
import type { IntentAnalysis } from "@/lib/types";

interface IntentAnalysisCardProps {
  analysis: IntentAnalysis;
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">暂无</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-md bg-cloud px-2.5 py-1 text-sm text-slate-700">
          {item}
        </span>
      ))}
    </div>
  );
}

export function IntentAnalysisCard({ analysis }: IntentAnalysisCardProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">意图解析结果</h2>
          <p className="mt-1 text-sm text-slate-500">系统把一句话拆成可编译的任务信息。</p>
        </div>
        <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {taskTypeLabels[analysis.taskType]}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-500">用户目标</p>
          <p className="mt-1 leading-7">{analysis.userGoal}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">目标输出</p>
          <p className="mt-1 leading-7">{analysis.targetOutput}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">使用场景</p>
          <p className="mt-1 leading-7">{analysis.scenario}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">识别置信度</p>
          <p className="mt-1 leading-7">{Math.round(analysis.confidence * 100)}%</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">缺失信息</p>
          <TagList items={analysis.missingInfo} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">默认假设</p>
          <TagList items={analysis.assumptions} />
        </div>
      </div>
    </section>
  );
}
