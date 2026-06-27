import type { IntentAnalysis } from "./types";

const questionMap: Record<string, string> = {
  项目主题: "项目具体做什么？",
  参赛方向: "参加哪个赛道？",
  核心创新点: "最大创新点是什么？",
  数据支撑: "已有调研或数据吗？",
  篇幅要求: "大概要多少字？",
  社团名称: "社团名称是什么？",
  目标人群: "主要面向谁？",
  发布平台: "发在哪个平台？",
  文案风格: "希望什么风格？",
  报名方式: "如何报名加入？",
  活动主题: "活动主题是什么？",
  参与对象: "主要谁来参加？",
  时间地点: "时间地点确定了吗？",
  活动流程: "需要哪些活动环节？",
  预算与物料: "有预算或物料要求吗？",
  宣传渠道: "通过哪些渠道宣传？",
  论文标题或材料: "论文材料有吗？",
  学科领域: "属于哪个领域？",
  总结用途: "用于汇报还是精读？",
  希望深度: "要简读还是深读？",
  是否需要批判性评价: "需要评价优缺点吗？",
  项目目标: "项目解决什么问题？",
  技术栈: "有指定技术栈吗？",
  拆解粒度: "拆到什么粒度？",
  团队规模: "几个人开发？",
  验收标准: "怎样算完成？",
  调研主题: "调研主题是什么？",
  调研对象: "调研对象是谁？",
  样本量: "预计多少份样本？",
  题型要求: "需要哪些题型？",
  分析目标: "最想分析什么？",
  具体目标: "最终想得到什么？",
  目标受众: "内容给谁看？",
  输出格式: "希望输出什么格式？",
  使用场景: "用在什么场景？",
};

const taskOpening: Partial<Record<IntentAnalysis["taskType"], string>> = {
  project_planning: "为提高项目材料质量，",
  club_operation: "为让社团内容更可执行，",
  academic_paper: "为避免论文总结失真，",
  coding: "为让开发任务更可执行，",
  survey: "为让问卷更可分析，",
};

export function generateClarifyingQuestions(
  missingInfo: string[],
  analysis?: IntentAnalysis,
): string[] {
  const opening = analysis ? taskOpening[analysis.taskType] ?? "" : "";

  return missingInfo
    .map((item) => questionMap[item] ?? `${item}是什么？`)
    .map((question) => (opening && question.length <= 16 ? `${opening}${question}` : question))
    .filter((question, index, questions) => questions.indexOf(question) === index)
    .slice(0, 3);
}
