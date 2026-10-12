import { writeFileSync } from "node:fs";
import { workbenchCases } from "../data/workbenchCases";
import { generatePromptPackage } from "../lib/intentAnalyzer";
import { inspectStructure } from "../lib/promptEvaluator";

// 仅规则生成；明确禁止此报告脚本触发付费模型。
process.env.LLM_PROVIDER = "mock";
process.env.LLM_ENABLED = "false";
const rows = [];
for (const item of workbenchCases) {
  const result = await generatePromptPackage(item.input);
  const content = result.package.artifacts[0].content;
  rows.push({ ...item, actualMode: result.package.mode, tools: result.package.targetTools, structure: inspectStructure(content), content, modelExperiment: "未执行", assistantReview: item.review, independentHumanReview: "未执行，待用户验收" });
}
writeFileSync("docs/workbench-cases.json", JSON.stringify(rows, null, 2) + "\n");
writeFileSync("docs/workbench-cases.md", [
  "# 工作台代表性案例", "", "记录日期：2026-10-13。12 个案例全部使用规则生成；没有真实模型实验。结构检查仅检测文字线索。内容核读由助手完成，独立人类核查尚未执行，不能据此声称模型效果提升。", "",
  "| 案例 | 输入 | 实际模式 / 目标工具 | 结构问题 | 助手核读与人工待核查事项 | 独立人工验收 |", "| --- | --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.id} | ${r.input} | ${r.actualMode} / ${r.tools.join("、")} | ${r.structure.issues.join("；") || "未检出缺项，仍需核查"} | ${r.assistantReview} | 未执行 |`),
  "", "完整原稿与结构结果见 [workbench-cases.json](workbench-cases.json)。可运行 `node node_modules/vite-node/vite-node.mjs scripts/review-cases.ts` 重新生成报告（始终禁用模型）。", "",
].join("\n"));
console.log(`Recorded ${rows.length} rule-only cases.`);
