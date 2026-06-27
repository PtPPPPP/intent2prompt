import { EVAL_WEIGHTS, type PromptEvaluation, type PromptSchema, type PromptVersion } from "./types";

function clamp(score: number, max: number): number {
  return Math.max(0, Math.min(max, score));
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

function countMissingPlaceholders(schema: PromptSchema): number {
  return schema.assumptions?.filter((item) => item.includes("待补充")).length ?? 0;
}

export function evaluatePrompt(
  promptVersionsOrSchema: PromptVersion[] | PromptSchema,
  maybeSchema?: PromptSchema,
): PromptEvaluation {
  const promptVersions = Array.isArray(promptVersionsOrSchema) ? promptVersionsOrSchema : [];
  const schema = maybeSchema ?? (promptVersionsOrSchema as PromptSchema);
  const combinedContent = [schema.role, schema.task, schema.context, schema.input, ...promptVersions.map((v) => v.content)].join("\n");
  const missingCount = countMissingPlaceholders(schema);
  const questionCount = schema.clarifyingQuestions?.length ?? 0;

  const dimensionScores = {
    taskClarity: clamp(
      9 +
        (schema.task.length >= 18 ? 5 : 2) +
        (schema.input.length >= 16 ? 3 : 1) +
        (schema.role ? 2 : 0) -
        (missingCount >= 4 ? 1 : 0),
      EVAL_WEIGHTS.taskClarity,
    ),
    contextCompleteness: clamp(
      6 +
        (schema.context.length >= 24 ? 3 : 1) +
        (schema.assumptions?.length ? 2 : 0) +
        (questionCount ? 2 : 0) -
        missingCount,
      EVAL_WEIGHTS.contextCompleteness,
    ),
    outputFormatClarity: clamp(
      5 + Math.min(schema.outputFormat.length, 6) + (combinedContent.includes("输出格式") ? 2 : 0),
      EVAL_WEIGHTS.outputFormatClarity,
    ),
    constraintQuality: clamp(
      5 +
        Math.min(schema.constraints.length, 5) +
        (schema.constraints.some((item) => item.includes("不要") || item.includes("不能")) ? 3 : 0) -
        (missingCount > 3 ? 1 : 0),
      EVAL_WEIGHTS.constraintQuality,
    ),
    executability: clamp(
      6 +
        (schema.qualityCriteria.length >= 4 ? 3 : 2) +
        (promptVersions.length === 3 ? 3 : 0) +
        (questionCount < 3 ? 2 : 0) -
        Math.max(0, missingCount - 2),
      EVAL_WEIGHTS.executability,
    ),
    hallucinationRiskControl: clamp(
      4 +
        (schema.constraints.some((item) => item.includes("不编造") || item.includes("占位")) ? 3 : 0) +
        (schema.safetyNotes?.length ? 2 : 0) +
        (missingCount <= 2 ? 1 : 0),
      EVAL_WEIGHTS.hallucinationRiskControl,
    ),
    chineseExpressionQuality: clamp(
      5 + (hasChinese(combinedContent) ? 3 : 0) + (combinedContent.includes("角色") ? 2 : 0),
      EVAL_WEIGHTS.chineseExpressionQuality,
    ),
  };

  const score = Object.values(dimensionScores).reduce((total, item) => total + item, 0);
  const weaknesses: string[] = [];

  if (!schema.clarifyingQuestions?.length) {
    weaknesses.push("缺少追问时，复杂任务可能仍有背景缺口。");
  }

  if (missingCount >= 4) {
    weaknesses.push("关键信息缺口较多，建议先补充追问答案。");
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
