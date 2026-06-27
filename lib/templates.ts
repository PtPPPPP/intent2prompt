import { intentRules, taskTypeLabels } from "./intentRules";
import type { PromptTemplate, TaskType } from "./types";

export { taskTypeLabels };

export const templates: PromptTemplate[] = [
  {
    id: "challenge_cup_plan",
    name: "挑战杯项目计划书",
    taskType: "project_planning",
    keywords: ["挑战杯", "项目计划书", "项目策划", "立项书", "大创", "创新创业"],
    requiredInfo: ["项目主题", "参赛方向", "核心创新点", "数据支撑", "篇幅要求"],
    recommendedRole: "你是一名熟悉挑战杯、大创和大学生创新项目申报的项目策划顾问。",
    targetOutput: "一份结构清晰、可继续扩写的项目计划书框架",
    scenario: "用于挑战杯、大创、科研训练或校园创新项目申报",
    commonConstraints: [
      "紧扣评审标准，不写空泛口号",
      "突出问题、对象、方案、创新点和可执行计划",
      "没有提供的数据和政策必须用占位符标出，不要编造",
    ],
    outputFormat: ["项目背景", "痛点分析", "目标用户", "解决方案", "创新点", "实施计划", "预期成果"],
    qualityCriteria: ["逻辑闭环", "创新点明确", "学生团队可执行", "适合继续补材料"],
    examples: ["帮我写一个挑战杯项目计划书"],
  },
  {
    id: "club_recruitment_copy",
    name: "社团招新文案",
    taskType: "club_operation",
    keywords: ["社团", "招新", "推文", "公众号", "小红书", "文案", "宣传"],
    requiredInfo: ["社团名称", "目标人群", "发布平台", "文案风格", "报名方式"],
    recommendedRole: "你是一名懂校园社团传播的新媒体文案策划。",
    targetOutput: "一份适合发布的社团招新文案",
    scenario: "用于公众号、社群、小红书、海报或校园招新宣传",
    commonConstraints: [
      "语言自然，有校园感",
      "突出加入理由和社团亮点",
      "保留可替换的信息占位符",
    ],
    outputFormat: ["标题", "开头钩子", "社团亮点", "适合人群", "加入方式", "结尾行动号召"],
    qualityCriteria: ["有吸引力", "信息清楚", "适合学生阅读", "可直接发布或改写"],
    examples: ["帮我做一个 AI 编程社团的招新文案"],
  },
  {
    id: "paper_summary",
    name: "论文总结",
    taskType: "academic_paper",
    keywords: ["论文", "文献", "paper", "摘要", "总结", "综述", "精读"],
    requiredInfo: ["论文标题或材料", "学科领域", "总结用途", "希望深度", "是否需要批判性评价"],
    recommendedRole: "你是一名严谨的学术阅读助理，擅长把论文拆成可理解的结构。",
    targetOutput: "一份结构化论文总结和后续追问清单",
    scenario: "用于课堂汇报、论文精读、科研训练或文献综述",
    commonConstraints: [
      "区分原文信息和个人推断",
      "不编造论文内容和实验结果",
      "保留不确定点，并提醒用户补充原文材料",
    ],
    outputFormat: ["一句话概括", "研究问题", "方法", "核心结论", "贡献", "局限", "可延伸问题"],
    qualityCriteria: ["准确", "层次清楚", "术语解释友好", "便于汇报"],
    examples: ["帮我总结一篇关于具身智能的论文"],
  },
  {
    id: "coding_requirement_breakdown",
    name: "编程项目需求拆解",
    taskType: "coding",
    keywords: ["编程", "代码", "开发", "项目需求", "需求拆解", "功能", "技术方案"],
    requiredInfo: ["项目目标", "技术栈", "拆解粒度", "团队规模", "验收标准"],
    recommendedRole: "你是一名务实的全栈产品工程师，擅长把模糊需求拆成可执行任务。",
    targetOutput: "一份可执行的项目需求拆解和开发任务列表",
    scenario: "用于课程项目、黑客松、个人开发或软件项目启动",
    commonConstraints: [
      "优先 MVP，不做过度设计",
      "明确功能边界和验收标准",
      "标出依赖关系、风险和优先级",
    ],
    outputFormat: ["需求理解", "用户流程", "功能模块", "数据结构", "开发任务", "MVP 边界", "验收标准"],
    qualityCriteria: ["能指导开发", "边界明确", "任务可拆分", "风险提前暴露"],
    examples: ["帮我拆解一个 prompt 生成器项目的开发需求"],
  },
  {
    id: "survey_design",
    name: "调查问卷设计",
    taskType: "survey",
    keywords: ["问卷", "调查", "调研", "量表", "访谈", "使用情况"],
    requiredInfo: ["调研主题", "调研对象", "样本量", "题型要求", "分析目标"],
    recommendedRole: "你是一名擅长问卷设计和校园调研的研究助理。",
    targetOutput: "一份可直接发放的问卷结构和题目",
    scenario: "用于课程作业、社团调研、用户研究或项目验证",
    commonConstraints: [
      "问题不能诱导",
      "选项要互斥且尽量完整",
      "题量适中，保护隐私",
    ],
    outputFormat: ["问卷说明", "甄别题", "基础信息题", "核心问题", "量表题", "开放题", "数据分析建议"],
    qualityCriteria: ["题目清楚", "选项合理", "能支撑分析目标", "填写负担低"],
    examples: ["帮我设计一个关于大学生 AI 使用情况的调查问卷"],
  },
  {
    id: "learning_outline",
    name: "学习复习提纲",
    taskType: "learning",
    keywords: ["学习", "复习", "课程", "知识点", "提纲", "笔记"],
    requiredInfo: ["课程主题", "学习阶段", "考试形式", "薄弱点"],
    recommendedRole: "你是一名擅长把知识点整理成复习路径的学习教练。",
    targetOutput: "一份清晰的复习提纲和学习计划",
    scenario: "用于课程复习、考试准备或自学规划",
    commonConstraints: ["先讲主干再讲细节", "用例子解释抽象概念", "标出易错点"],
    outputFormat: ["知识地图", "重点概念", "例题或案例", "易错点", "复习顺序", "自测问题"],
    qualityCriteria: ["结构清楚", "适合复习", "重点明确", "能执行"],
  },
  {
    id: "data_report_analysis",
    name: "数据报告分析",
    taskType: "data_analysis",
    keywords: ["数据", "报告", "分析", "图表", "指标", "报表"],
    requiredInfo: ["数据来源", "分析目标", "关键指标", "受众", "输出格式"],
    recommendedRole: "你是一名擅长业务和调研报告的数据分析师。",
    targetOutput: "一份结构化数据分析报告",
    scenario: "用于课程汇报、项目复盘、运营分析或调研报告",
    commonConstraints: ["先说明数据限制", "结论必须对应证据", "不捏造数据"],
    outputFormat: ["核心结论", "关键发现", "指标解释", "趋势或异常", "原因分析", "行动建议"],
    qualityCriteria: ["结论有证据", "表达清楚", "适合汇报", "建议可执行"],
  },
  {
    id: "presentation_structure",
    name: "项目路演 PPT",
    taskType: "presentation",
    keywords: ["PPT", "路演", "汇报", "演示", "答辩"],
    requiredInfo: ["汇报主题", "听众", "时长", "页数", "重点信息"],
    recommendedRole: "你是一名懂项目路演和汇报结构的内容策划。",
    targetOutput: "一份 PPT 内容结构和每页要点",
    scenario: "用于项目路演、课程展示、比赛答辩或社团汇报",
    commonConstraints: ["一页只讲一个重点", "避免堆字", "突出结论和证据"],
    outputFormat: ["封面", "问题背景", "方案", "亮点", "计划", "风险", "总结页"],
    qualityCriteria: ["节奏清楚", "适合演讲", "重点突出", "便于做成 PPT"],
  },
  {
    id: "business_plan",
    name: "商业计划书",
    taskType: "business_plan",
    keywords: ["商业计划书", "商业模式", "创业", "融资", "市场", "BP"],
    requiredInfo: ["产品或服务", "目标客户", "市场痛点", "商业模式", "竞争优势"],
    recommendedRole: "你是一名熟悉创新创业比赛的商业计划书顾问。",
    targetOutput: "一份商业计划书大纲和关键内容说明",
    scenario: "用于创新创业比赛、项目申报或创业计划展示",
    commonConstraints: ["商业假设要明确", "不虚构市场数据", "先证明问题真实存在"],
    outputFormat: ["项目概述", "市场机会", "产品方案", "商业模式", "竞争分析", "团队计划", "财务假设"],
    qualityCriteria: ["商业逻辑闭环", "风险清楚", "表达专业", "适合比赛材料"],
  },
  {
    id: "general_writing",
    name: "通用写作",
    taskType: "writing",
    keywords: ["写", "文案", "稿", "润色", "改写", "演讲稿"],
    requiredInfo: ["写作主题", "目标读者", "发布场景", "风格要求", "篇幅要求"],
    recommendedRole: "你是一名表达清楚、能根据场景调整语言的中文写作助手。",
    targetOutput: "一份结构清楚、可继续修改的中文稿件",
    scenario: "用于校园写作、宣传表达、演讲或材料整理",
    commonConstraints: ["语言自然", "不要空话套话", "结构清楚"],
    outputFormat: ["标题", "开头", "主体", "结尾", "可选改写建议"],
    qualityCriteria: ["表达清楚", "贴合场景", "有具体内容", "便于修改"],
  },
];

export const fallbackTemplate: PromptTemplate = {
  id: "general_task",
  name: "通用任务",
  taskType: "other",
  keywords: [],
  requiredInfo: ["具体目标", "目标受众", "输出格式", "使用场景"],
  recommendedRole: "你是一名擅长把模糊需求转成可执行任务的 AI 助手。",
  targetOutput: "一份结构化、可直接使用的任务 prompt",
  scenario: "用于把简短想法整理成清晰 AI 指令",
  commonConstraints: ["先澄清目标", "不编造未提供的信息", "输出要可执行"],
  outputFormat: ["任务目标", "背景信息", "执行步骤", "输出格式", "注意事项"],
  qualityCriteria: ["目标清楚", "格式明确", "约束可执行", "便于复制使用"],
};

export function getTemplate(taskType: TaskType): PromptTemplate {
  return templates.find((template) => template.taskType === taskType) ?? fallbackTemplate;
}

export function getTemplateByInput(input: string): PromptTemplate {
  const normalizedInput = input.toLowerCase();
  const scored = templates
    .map((template) => ({
      template,
      score: template.keywords.filter((keyword) => normalizedInput.includes(keyword.toLowerCase()))
        .length,
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score ? scored[0].template : fallbackTemplate;
}

export function getIntentRuleTemplate(taskType: TaskType): PromptTemplate {
  const rule = intentRules.find((item) => item.taskType === taskType);
  const template = getTemplate(taskType);

  return rule ? { ...template, targetOutput: rule.defaultOutput, scenario: rule.defaultScenario } : template;
}
