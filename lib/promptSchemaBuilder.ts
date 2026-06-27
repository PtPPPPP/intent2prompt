import { getIntentRule } from "./intentRules";
import { getTemplate } from "./templates";
import type { IntentAnalysis, PromptSchema } from "./types";

function buildMissingInfoAssumptions(missingInfo: string[]): string[] {
  return missingInfo.slice(0, 4).map((item) => `暂未提供「${item}」，请用【待补充：${item}】标出。`);
}

export function buildPromptSchema(
  input: string,
  analysis: IntentAnalysis,
  clarifyingQuestions: string[],
): PromptSchema {
  const template = getTemplate(analysis.taskType);
  const rule = getIntentRule(analysis.taskType);

  return {
    role: template.recommendedRole,
    task: analysis.userGoal || rule.defaultGoal,
    context: [
      analysis.scenario || rule.defaultScenario,
      "用户只提供了简短中文意图，需要把模糊需求整理成可执行 prompt。",
      "缺失信息不能暗自编造，必须显式标出。",
    ].join("。"),
    input,
    constraints: [
      ...template.commonConstraints,
      "缺失信息用【待补充】占位，不要假装已经知道",
      "先给结构，再给可直接使用的正文、清单或框架",
    ],
    outputFormat: template.outputFormat,
    qualityCriteria: template.qualityCriteria,
    examples: template.examples,
    clarifyingQuestions,
    assumptions: [...analysis.assumptions, ...buildMissingInfoAssumptions(analysis.missingInfo)],
    safetyNotes: ["涉及数据、论文、政策或事实判断时，必须标明来源和不确定性。"],
  };
}
