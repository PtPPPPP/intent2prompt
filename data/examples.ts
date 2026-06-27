import type { TaskType } from "@/lib/types";

export interface ExampleIntent {
  input: string;
  expectedTaskType: TaskType;
  expectedMissingInfo: string[];
}

export const exampleCases: ExampleIntent[] = [
  {
    input: "帮我写一个挑战杯项目计划书",
    expectedTaskType: "project_planning",
    expectedMissingInfo: ["项目主题", "参赛方向", "核心创新点"],
  },
  {
    input: "帮我做一个 AI 编程社团的招新文案",
    expectedTaskType: "club_operation",
    expectedMissingInfo: ["目标人群", "发布平台", "文案风格"],
  },
  {
    input: "帮我总结一篇关于具身智能的论文",
    expectedTaskType: "academic_paper",
    expectedMissingInfo: ["总结用途", "希望深度"],
  },
  {
    input: "帮我设计一个关于大学生 AI 使用情况的调查问卷",
    expectedTaskType: "survey",
    expectedMissingInfo: ["样本量", "题型要求", "分析目标"],
  },
  {
    input: "帮我拆解一个 prompt 生成器项目的开发需求",
    expectedTaskType: "coding",
    expectedMissingInfo: ["技术栈", "拆解粒度", "验收标准"],
  },
  {
    input: "帮我做一个创新创业比赛的商业计划书大纲",
    expectedTaskType: "business_plan",
    expectedMissingInfo: ["目标客户", "商业模式", "竞争优势"],
  },
  {
    input: "帮我生成一份社团活动策划案",
    expectedTaskType: "club_operation",
    expectedMissingInfo: ["目标人群", "发布平台", "文案风格"],
  },
  {
    input: "帮我把课程知识点整理成复习提纲",
    expectedTaskType: "learning",
    expectedMissingInfo: ["学习阶段", "薄弱点"],
  },
  {
    input: "帮我分析一份数据报告",
    expectedTaskType: "data_analysis",
    expectedMissingInfo: ["分析目标", "关键指标"],
  },
  {
    input: "帮我做一页项目路演 PPT 的内容结构",
    expectedTaskType: "presentation",
    expectedMissingInfo: ["听众", "时长或页数"],
  },
];

export const exampleIntents = exampleCases.map((example) => example.input);
