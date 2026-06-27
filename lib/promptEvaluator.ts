import { EVAL_WEIGHTS, type PromptEvaluation, type PromptSchema, type PromptVersion } from "./types";

function clamp(score: number, max: number): number {
  return Math.max(0, Math.min(max, score));
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

export function evaluatePrompt(
  promptVersionsOrSchema: PromptVersion[] | PromptSchema,
  maybeSchema?: PromptSchema,
): PromptEvaluation {
  const promptVersions = Array.isArray(promptVersionsOrSchema) ? promptVersionsOrSchema : [];
  const schema = maybeSchema ?? (promptVersionsOrSchema as PromptSchema);
  const combinedContent = [schema.role, schema.task, schema.context, schema.input, ...promptVersions.map((v) => v.content)].join("\n");

  const dimensionScores = {
    taskClarity: clamp(
      8 + (schema.task.length >= 12 ? 6 : 2) + (schema.input ? 3 : 0) + (schema.role ? 3 : 0),
      EVAL_WEIGHTS.taskClarity,
    ),
    contextCompleteness: clamp(
      5 +
        (schema.context.length >= 20 ? 4 : 1) +
        (schema.assumptions?.length ? 3 : 0) +
        (schema.clarifyingQuestions?.length ? 3 : 0),
      EVAL_WEIGHTS.contextCompleteness,
    ),
    outputFormatClarity: clamp(
      4 + schema.outputFormat.length * 2 + (combinedContent.includes("输出格式") ? 3 : 0),
      EVAL_WEIGHTS.outputFormatClarity,
    ),
    constraintQuality: clamp(
      4 +
        schema.constraints.length * 2 +
        (schema.constraints.some((item) => item.includes("不要") || item.includes("不能")) ? 3 : 0),
      EVAL_WEIGHTS.constraintQuality,
    ),
    executability: clamp(
      5 +
        (schema.role ? 2 : 0) +
        (schema.input ? 2 : 0) +
        (schema.qualityCriteria.length >= 3 ? 3 : 0) +
        (promptVersions.length === 3 ? 3 : 0),
      EVAL_WEIGHTS.executability,
    ),
    hallucinationRiskControl: clamp(
      3 +
        (schema.constraints.some((item) => item.includes("不编造") || item.includes("占位")) ? 3 : 0) +
        (schema.safetyNotes?.length ? 2 : 0) +
        (schema.assumptions?.length ? 2 : 0),
      EVAL_WEIGHTS.hallucinationRiskControl,
    ),
    chineseExpressionQuality: clamp(
      4 + (hasChinese(combinedContent) ? 4 : 0) + (combinedContent.includes("角色") ? 2 : 0),
      EVAL_WEIGHTS.chineseExpressionQuality,
    ),
  };

  const score = Object.values(dimensionScores).reduce((total, item) => total + item, 0);
  const weaknesses: string[] = [];

  if (!schema.clarifyingQuestions?.length) {
    weaknesses.push("缺少追问时，复杂任务可能仍有背景缺口。");
  }

  if (dimensionScores.hallucinationRiskControl < 8) {
    weaknesses.push("幻觉风险控制还可以更强。");
  }

  return {
    score,
    dimensionScores,
    strengths: ["任务结构清楚", "输出格式明确", "已显式处理缺失信息"],
    weaknesses,
    suggestions: weaknesses.length
      ? ["先补充追问答案，再重新生成 prompt。", "涉及事实、数据或论文内容时，请补充来源材料。"]
      : ["可以直接复制专家版或比赛/项目版使用。"],
  };
}
