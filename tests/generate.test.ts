import { describe, expect, it } from "vitest";
import { analyzeIntent, generatePromptPackage } from "@/lib/intentAnalyzer";
import { detectMissingInfo } from "@/lib/missingInfoDetector";
import { generateClarifyingQuestions } from "@/lib/questionGenerator";
import { buildPromptSchema } from "@/lib/promptSchemaBuilder";
import { compilePromptVersions } from "@/lib/promptCompiler";
import { evaluatePrompt } from "@/lib/promptEvaluator";
import { EVAL_WEIGHTS } from "@/lib/types";
import { exampleCases } from "@/data/examples";

describe("generatePromptPackage", () => {
  it("turns a short Challenge Cup intent into a complete prompt package", async () => {
    const result = await generatePromptPackage("我想做一个挑战杯项目计划书");

    expect(result.analysis.taskType).toBe("project_planning");
    expect(result.analysis.missingInfo.length).toBeGreaterThan(0);
    expect(result.clarifyingQuestions.length).toBeLessThanOrEqual(3);
    expect(result.promptVersions).toHaveLength(3);
    expect(result.promptVersions.map((version) => version.mode)).toEqual([
      "concise",
      "expert",
      "competition",
    ]);
    expect(result.promptVersions[1].content).toContain("角色设定 Role");
    expect(result.promptVersions[1].content).toContain("输出格式 Output Format");
    expect(result.evaluation.score).toBeGreaterThanOrEqual(70);
    expect(result.package.artifacts.find((artifact) => artifact.recommended)?.content).toBeTruthy();
  });

  it("generates an engineering package for Codex and a collaboration package for Codex plus Claude", async () => {
    const engineering = await generatePromptPackage("让 Codex 开发一个社团报名系统");
    const collaboration = await generatePromptPackage("让 Codex 和 Claude 一起开发一个 Prompt 生成器");

    expect(engineering.package.mode).toBe("engineering_package");
    expect(engineering.package.targetTools).toEqual(["codex"]);
    expect(engineering.package.artifacts.map((artifact) => artifact.type)).toEqual(
      expect.arrayContaining(["main_prompt", "agent_md", "fix_prompt", "acceptance_prompt"]),
    );
    expect(collaboration.package.mode).toBe("multi_ai_package");
    expect(collaboration.package.targetTools).toEqual(["codex", "claude"]);
    expect(collaboration.package.artifacts.map((artifact) => artifact.type)).toContain("integration_prompt");
  });

  it("uses the image prompt structure and accepts optional clarification answers", async () => {
    const result = await generatePromptPackage("生成一张高校科技社团招新海报的图片 Prompt", {
      clarificationAnswers: { "clarification-1": "面向 2026 级新生" },
    });

    const mainPrompt = result.package.artifacts.find((artifact) => artifact.recommended)?.content ?? "";
    expect(result.package.mode).toBe("single_prompt");
    expect(result.package.targetTools).toEqual(["image_generation"]);
    expect(mainPrompt).toContain("主体与动作");
    expect(mainPrompt).toContain("面向 2026 级新生");
  });

  it("detects survey intents and keeps clarifying questions short", async () => {
    const result = await generatePromptPackage("帮我设计一个问卷");

    expect(result.analysis.taskType).toBe("survey");
    expect(result.analysis.targetOutput).toContain("问卷");
    expect(result.clarifyingQuestions.length).toBeLessThanOrEqual(3);
    expect(result.clarifyingQuestions.every((question) => question.length <= 36)).toBe(
      true,
    );
  });

  it("recognizes the three required Claude acceptance examples", async () => {
    const examples = [
      ["帮我写一个挑战杯项目计划书", "project_planning"],
      ["帮我做一个 AI 编程社团的招新文案", "club_operation"],
      ["帮我总结一篇关于具身智能的论文", "academic_paper"],
    ] as const;

    for (const [input, taskType] of examples) {
      const result = await generatePromptPackage(input);

      expect(result.analysis.taskType).toBe(taskType);
      expect(result.clarifyingQuestions.length).toBeLessThanOrEqual(3);
      expect(result.promptVersions).toHaveLength(3);
      expect(result.evaluation.score).toBeGreaterThanOrEqual(70);
    }
  });

  it("uses the Claude integration function signatures end to end", () => {
    const input = "帮我做一个 AI 编程社团的招新文案";
    const analysis = analyzeIntent(input);
    const missingInfo = detectMissingInfo(input, analysis);
    const questions = generateClarifyingQuestions(missingInfo, analysis);
    const schema = buildPromptSchema(input, { ...analysis, missingInfo }, questions);
    const versions = compilePromptVersions(schema);
    const evaluation = evaluatePrompt(versions, schema);

    expect(analysis.taskType).toBe("club_operation");
    expect(missingInfo).toEqual(
      expect.arrayContaining(["目标人群", "发布平台", "文案风格"]),
    );
    expect(questions).toHaveLength(3);
    expect(versions.map((version) => version.mode)).toEqual([
      "concise",
      "expert",
      "competition",
    ]);
    expect(evaluation.score).toBe(
      Object.values(evaluation.dimensionScores).reduce((total, score) => total + score, 0),
    );
    expect(EVAL_WEIGHTS.taskClarity).toBe(20);
  });

  it("supports all 10 demo examples with useful prompt outputs", async () => {
    const results = [];

    for (const example of exampleCases) {
      const result = await generatePromptPackage(example.input);
      results.push(result);

      expect(result.analysis.taskType).toBe(example.expectedTaskType);
      expect(result.analysis.missingInfo).toEqual(
        expect.arrayContaining(example.expectedMissingInfo),
      );
      expect(result.clarifyingQuestions.length).toBeLessThanOrEqual(3);
      expect(result.promptVersions).toHaveLength(3);
      expect(new Set(result.promptVersions.map((version) => version.content)).size).toBe(3);
      expect(result.evaluation.score).toBeGreaterThanOrEqual(70);
    }

    const scores = results.map((result) => result.evaluation.score);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(4);
  });
});
