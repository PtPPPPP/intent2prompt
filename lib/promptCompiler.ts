import type { PromptMode, PromptSchema, PromptVersion } from "./types";

const modeTitles: Record<PromptMode, string> = {
  concise: "简洁版",
  expert: "专家版",
  competition: "比赛/项目版",
};

const modeDescriptions: Record<PromptMode, string> = {
  concise: "适合快速复制给 AI，重点清楚。",
  expert: "适合追求高质量输出，结构和约束更完整。",
  competition: "适合挑战杯、创新创业、社团项目和路演材料。",
};

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function questions(questionsValue?: string[]): string {
  if (!questionsValue?.length) {
    return "无，当前信息可以先生成初稿。";
  }

  return list(questionsValue);
}

function compileConcise(schema: PromptSchema): string {
  return [
    `你将扮演：${schema.role}`,
    "",
    `请根据我的意图完成任务：${schema.task}`,
    "",
    `我的输入：${schema.input}`,
    "",
    "请按以下格式输出：",
    list(schema.outputFormat),
    "",
    "要求：",
    list(schema.constraints.slice(0, 4)),
    "",
    "如果关键信息缺失，请先列出最多 3 个追问，再基于默认假设给一个可修改版本。",
  ].join("\n");
}

function compileDetailed(schema: PromptSchema, competitionMode = false): string {
  const competitionExtra = competitionMode
    ? [
        "",
        "比赛/项目强化要求",
        "- 明确问题、对象、方案、创新点和可执行计划",
        "- 用学生项目能理解和复用的语言表达",
        "- 对缺失的项目数据和背景只给占位符，不编造",
      ].join("\n")
    : "";

  return [
    "角色设定 Role",
    schema.role,
    "",
    "任务目标 Task",
    schema.task,
    "",
    "背景信息 Context",
    schema.context,
    "",
    "输入材料 Input",
    schema.input,
    "",
    "输出格式 Output Format",
    list(schema.outputFormat),
    "",
    "约束条件 Constraints",
    list(schema.constraints),
    "",
    "质量标准 Quality Criteria",
    list(schema.qualityCriteria),
    "",
    "默认假设 Assumptions",
    list(schema.assumptions ?? []),
    "",
    "需要时的追问 Clarifying Questions",
    questions(schema.clarifyingQuestions),
    competitionExtra,
  ].join("\n");
}

export function compilePromptVersions(schema: PromptSchema): PromptVersion[] {
  return [
    {
      mode: "concise",
      title: modeTitles.concise,
      description: modeDescriptions.concise,
      content: compileConcise(schema),
    },
    {
      mode: "expert",
      title: modeTitles.expert,
      description: modeDescriptions.expert,
      content: compileDetailed(schema),
    },
    {
      mode: "competition",
      title: modeTitles.competition,
      description: modeDescriptions.competition,
      content: compileDetailed(schema, true),
    },
  ];
}
