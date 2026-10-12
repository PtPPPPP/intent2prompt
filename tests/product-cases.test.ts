import { afterEach, expect, it, vi } from "vitest";
import { workbenchCases } from "@/data/workbenchCases";
import { generatePromptPackage } from "@/lib/intentAnalyzer";
import { inspectStructure } from "@/lib/promptEvaluator";
import { buildProtectedContext, checkProtectedContent } from "@/lib/optimizationGuard";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each(workbenchCases)("preserves case $id in rule generation", async ({ input, mode }) => {
  vi.stubEnv("LLM_PROVIDER", "mock"); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  const result = await generatePromptPackage(input), main = result.package.artifacts[0].content;
  expect(result.package.mode).toBe(mode); expect(result.package.clarificationQuestions.length).toBeLessThanOrEqual(3); expect(main).toContain(input);
  expect(checkProtectedContent(main, buildProtectedContext(input, result.package.targetTools, main, main))).toEqual([]);
  expect(inspectStructure(main).present).toContain("任务目标"); expect(fetchMock).not.toHaveBeenCalled();
});
