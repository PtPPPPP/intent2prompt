import type { PromptEvaluation } from "@/lib/types";

interface EvaluationCardProps {
  evaluation: PromptEvaluation;
}

const dimensionLabels: Record<keyof PromptEvaluation["dimensionScores"], string> = {
  taskClarity: "任务清晰度",
  contextCompleteness: "背景完整度",
  outputFormatClarity: "输出格式清晰度",
  constraintQuality: "约束质量",
  executability: "可执行性",
  hallucinationRiskControl: "防编造控制",
  chineseExpressionQuality: "中文表达质量",
};

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Prompt 质量评分</h2>
          <p className="mt-1 text-sm text-slate-500">MVP 阶段使用规则评分，帮助判断 prompt 是否完整。</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-accent">{evaluation.score}</p>
          <p className="text-xs text-slate-500">满分 100</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {Object.entries(evaluation.dimensionScores).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-md bg-cloud px-3 py-2">
            <span className="text-sm text-slate-600">
              {dimensionLabels[key as keyof PromptEvaluation["dimensionScores"]]}
            </span>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-500">建议</p>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {evaluation.suggestions.map((suggestion) => (
            <li key={suggestion}>- {suggestion}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
