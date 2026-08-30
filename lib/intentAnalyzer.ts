import { classifyIntentByRules, getIntentRule } from "./intentRules";
import { detectMissingInfo } from "./missingInfoDetector";
import { buildPromptSchema } from "./promptSchemaBuilder";
import { compilePromptVersions } from "./promptCompiler";
import { evaluatePrompt } from "./promptEvaluator";
import { getTemplate, getTemplateByInput } from "./templates";
import type { GeneratePromptResult, IntentAnalysis, TaskType } from "./types";
import { generateClarifyingQuestions } from "./questionGenerator";
import { enhancePromptVersions } from "./llmClient";
import { buildPromptPackage } from "./promptPackageBuilder";
import type { GeneratePromptOptions } from "./types";

function inferTaskType(input: string): { taskType: TaskType; confidence: number } {
  const ruleResult = classifyIntentByRules(input);
  if (ruleResult.taskType !== "other") {
    return ruleResult;
  }

  const template = getTemplateByInput(input);
  return {
    taskType: template.taskType,
    confidence: template.taskType === "other" ? ruleResult.confidence : 0.72,
  };
}

function inferGoal(input: string, taskType: TaskType): string {
  const rule = getIntentRule(taskType);
  return `帮助用户完成“${input}”：${rule.defaultGoal}`;
}

function extractKnownInfo(input: string, taskType: TaskType): string[] {
  const knownInfo = [`原始意图：${input}`];

  if (/挑战杯|大创|创新创业|科研训练/.test(input)) {
    knownInfo.push("包含学生竞赛或创新项目场景");
  }

  if (/社团|招新|协会|学生会/.test(input)) {
    knownInfo.push("包含校园社团运营场景");
  }

  if (/AI|人工智能|prompt|编程|代码|开发/i.test(input)) {
    knownInfo.push("包含技术或 AI 相关主题");
  }

  if (taskType === "academic_paper" && /关于(.+?)的论文/.test(input)) {
    knownInfo.push(`论文主题线索：${input.match(/关于(.+?)的论文/)?.[1]}`);
  }

  if (taskType === "survey" && /大学生/.test(input)) {
    knownInfo.push("调研对象可能是大学生");
  }

  return knownInfo;
}

export function analyzeIntent(input: string): IntentAnalysis {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error("请输入一句中文意图。");
  }

  const { taskType, confidence } = inferTaskType(trimmedInput);
  const rule = getIntentRule(taskType);
  const template = getTemplate(taskType);
  const baseAnalysis: IntentAnalysis = {
    taskType,
    userGoal: inferGoal(trimmedInput, taskType),
    targetOutput: template.targetOutput || rule.defaultOutput,
    scenario: template.scenario || rule.defaultScenario,
    knownInfo: extractKnownInfo(trimmedInput, taskType),
    missingInfo: [],
    assumptions: [
      "用户希望先得到可修改的高质量初稿，而不是一次性最终定稿",
      "如果缺少背景材料，系统会使用【待补充】占位提醒用户补充",
    ],
    confidence,
  };

  return {
    ...baseAnalysis,
    missingInfo: detectMissingInfo(trimmedInput, baseAnalysis),
  };
}

// MVP 主链路保持规则 / 模板生成，避免没有 API key 时影响完整演示。
export async function generatePromptPackage(
  input: string,
  options: GeneratePromptOptions = {},
): Promise<GeneratePromptResult> {
  const originalInput = input.trim();
  // analyzeIntent 返回值已含 missingInfo（只依赖 taskType 与输入文本），无需重复计算
  const completedAnalysis = analyzeIntent(originalInput);
  const clarifyingQuestions = generateClarifyingQuestions(completedAnalysis.missingInfo, completedAnalysis);
  const promptSchema = buildPromptSchema(originalInput, completedAnalysis, clarifyingQuestions);
  const rulePromptVersions = compilePromptVersions(promptSchema);
  const rulePromptPackage = buildPromptPackage(originalInput, completedAnalysis, clarifyingQuestions, options);
  const recommendedArtifact = rulePromptPackage.artifacts.find(
    (artifact) => artifact.id === rulePromptPackage.recommendedArtifactId,
  );
  const providerResult = await enhancePromptVersions([
    ...rulePromptVersions,
    ...(recommendedArtifact
      ? [{ mode: "expert" as const, title: recommendedArtifact.title, description: recommendedArtifact.description, content: recommendedArtifact.content }]
      : []),
  ]);
  const promptVersions = providerResult.promptVersions.slice(0, rulePromptVersions.length);
  const enhancedRecommended = providerResult.promptVersions[rulePromptVersions.length];
  const promptPackage = enhancedRecommended && recommendedArtifact
    ? { ...rulePromptPackage, artifacts: rulePromptPackage.artifacts.map((artifact) => artifact.id === recommendedArtifact.id ? { ...artifact, content: enhancedRecommended.content } : artifact) }
    : rulePromptPackage;
  const evaluation = evaluatePrompt(promptVersions, promptSchema);

  return {
    originalInput,
    package: promptPackage,
    analysis: completedAnalysis,
    clarifyingQuestions,
    promptSchema,
    promptVersions,
    evaluation,
    providerStatus: providerResult.providerStatus,
    providerMessage: providerResult.providerMessage,
  };
}
