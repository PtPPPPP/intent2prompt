import type { IntentRule, TaskType } from "./types";

export const taskTypeLabels: Record<TaskType, string> = {
  project_planning: "项目策划",
  club_operation: "社团运营",
  writing: "写作",
  academic_paper: "论文",
  coding: "代码",
  data_analysis: "数据分析",
  survey: "调查问卷",
  learning: "学习",
  presentation: "PPT/演示",
  business_plan: "商业计划",
  other: "其他",
};

export const intentRules: IntentRule[] = [
  {
    taskType: "project_planning",
    label: taskTypeLabels.project_planning,
    keywords: ["挑战杯", "大创", "项目计划书", "项目策划", "立项书", "科研训练", "创新创业"],
    defaultGoal: "把项目想法整理成可申报、可执行、可继续扩写的项目材料。",
    defaultOutput: "项目计划书框架",
    defaultScenario: "挑战杯、大创、科研训练或校园创新项目申报",
    priority: 95,
  },
  {
    taskType: "business_plan",
    label: taskTypeLabels.business_plan,
    keywords: ["商业计划书", "商业模式", "BP", "创业", "融资", "市场分析"],
    defaultGoal: "把商业想法整理成商业计划书大纲和关键内容。",
    defaultOutput: "商业计划书大纲",
    defaultScenario: "创新创业比赛、项目申报或创业计划展示",
    priority: 90,
  },
  {
    taskType: "presentation",
    label: taskTypeLabels.presentation,
    keywords: ["PPT", "路演", "汇报", "演示", "答辩", "讲稿"],
    defaultGoal: "把内容整理成适合展示和讲述的 PPT 结构。",
    defaultOutput: "PPT 内容结构",
    defaultScenario: "路演、课程展示、比赛答辩或项目汇报",
    priority: 85,
  },
  {
    taskType: "survey",
    label: taskTypeLabels.survey,
    keywords: ["问卷", "调查", "调研", "量表", "访谈", "使用情况"],
    defaultGoal: "设计一份能支撑分析目标的问卷。",
    defaultOutput: "问卷结构和题目",
    defaultScenario: "课程作业、社团调研、用户研究或项目验证",
    priority: 84,
  },
  {
    taskType: "academic_paper",
    label: taskTypeLabels.academic_paper,
    keywords: ["论文", "文献", "paper", "摘要", "总结", "综述", "精读"],
    defaultGoal: "把论文材料整理成结构化总结，帮助理解和汇报。",
    defaultOutput: "论文结构化总结",
    defaultScenario: "课堂汇报、论文精读、科研训练或文献综述",
    priority: 84,
  },
  {
    taskType: "coding",
    label: taskTypeLabels.coding,
    keywords: ["编程", "代码", "开发", "需求拆解", "技术方案", "功能", "接口", "项目需求"],
    defaultGoal: "把编程项目想法拆成可执行的需求和开发任务。",
    defaultOutput: "项目需求拆解和开发任务列表",
    defaultScenario: "课程项目、黑客松、个人开发或软件项目启动",
    priority: 82,
  },
  {
    taskType: "data_analysis",
    label: taskTypeLabels.data_analysis,
    keywords: ["数据", "报告", "分析", "图表", "指标", "报表"],
    defaultGoal: "把数据或报告整理成有结论、有证据的分析内容。",
    defaultOutput: "数据分析报告",
    defaultScenario: "课程汇报、项目复盘、运营分析或调研报告",
    priority: 76,
  },
  {
    taskType: "club_operation",
    label: taskTypeLabels.club_operation,
    keywords: ["社团", "招新", "学生会", "协会", "活动策划", "推文", "公众号", "宣传文案"],
    defaultGoal: "把校园社团需求整理成可发布、可执行的运营内容。",
    defaultOutput: "社团运营或招新文案",
    defaultScenario: "社团招新、活动宣传、公众号推文或校园传播",
    priority: 74,
  },
  {
    taskType: "learning",
    label: taskTypeLabels.learning,
    keywords: ["学习", "复习", "课程", "知识点", "提纲", "笔记", "备考"],
    defaultGoal: "把知识内容整理成适合学习和复习的结构。",
    defaultOutput: "学习提纲或复习计划",
    defaultScenario: "课程复习、考试准备或自学规划",
    priority: 65,
  },
  {
    taskType: "writing",
    label: taskTypeLabels.writing,
    keywords: ["写作", "文案", "稿", "润色", "改写", "演讲稿", "推文"],
    defaultGoal: "把写作意图整理成结构清楚、可直接生成内容的 prompt。",
    defaultOutput: "中文稿件或文案",
    defaultScenario: "校园写作、宣传表达、演讲或材料整理",
    priority: 50,
  },
  {
    taskType: "other",
    label: taskTypeLabels.other,
    keywords: [],
    defaultGoal: "把模糊需求整理成清晰可执行的 AI 指令。",
    defaultOutput: "结构化 prompt",
    defaultScenario: "通用 AI 使用场景",
    priority: 0,
  },
];

export function classifyIntentByRules(input: string): { taskType: TaskType; confidence: number } {
  const text = input.trim().toLowerCase();
  if (!text) {
    return { taskType: "other", confidence: 0 };
  }

  const best = intentRules
    .filter((rule) => rule.taskType !== "other")
    .map((rule) => {
      const hits = rule.keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
      return { rule, score: hits * rule.priority };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score === 0) {
    return { taskType: "other", confidence: 0.45 };
  }

  return {
    taskType: best.rule.taskType,
    confidence: Math.min(0.95, 0.62 + best.score / 400),
  };
}

export function getIntentRule(taskType: TaskType): IntentRule {
  return intentRules.find((rule) => rule.taskType === taskType) ?? intentRules[intentRules.length - 1];
}
