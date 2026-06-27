import { getTemplate } from "./templates";
import type { IntentAnalysis, TaskType } from "./types";

interface MissingInfoRule {
  label: string;
  presentIf: RegExp[];
}

const missingRules: Record<TaskType, MissingInfoRule[]> = {
  project_planning: [
    { label: "项目主题", presentIf: [/关于/, /主题/, /方向/, /AI|人工智能/i, /教育|养老|低碳|乡村/] },
    { label: "参赛方向", presentIf: [/赛道/, /组别/, /主赛道/, /红色专项/, /创业计划/] },
    { label: "核心创新点", presentIf: [/创新点/, /亮点/, /突破/, /首次/, /相比/] },
    { label: "数据支撑", presentIf: [/数据/, /调研/, /问卷/, /访谈/, /实验/] },
    { label: "篇幅要求", presentIf: [/\d+\s*字/, /页/, /篇幅/, /字数/] },
  ],
  club_operation: [
    { label: "社团名称", presentIf: [/[A-Za-z0-9\u4e00-\u9fa5]+社团/, /协会/, /学生会/] },
    { label: "目标人群", presentIf: [/新生/, /大一/, /同学/, /全校/, /面向/] },
    { label: "发布平台", presentIf: [/公众号/, /小红书/, /社群/, /海报/, /朋友圈/] },
    { label: "文案风格", presentIf: [/活泼/, /热血/, /正式/, /幽默/, /风格/, /专业/] },
    { label: "报名方式", presentIf: [/报名/, /二维码/, /链接/, /群号/, /联系方式/] },
  ],
  academic_paper: [
    { label: "论文标题或材料", presentIf: [/关于/, /题目/, /标题/, /PDF|pdf/, /链接/, /原文/, /具身智能/] },
    { label: "学科领域", presentIf: [/AI|人工智能|机器人|教育|经济|医学|计算机/i, /领域/] },
    { label: "总结用途", presentIf: [/汇报/, /精读/, /笔记/, /综述/, /课堂/] },
    { label: "希望深度", presentIf: [/简要/, /详细/, /深度/, /一页/, /\d+\s*字/] },
    { label: "是否需要批判性评价", presentIf: [/评价/, /不足/, /局限/, /批判/, /创新点/] },
  ],
  coding: [
    { label: "项目目标", presentIf: [/目标/, /解决/, /实现/, /生成器/, /系统/, /平台/] },
    { label: "技术栈", presentIf: [/Next|React|Vue|Python|Java|Node|TypeScript|TS/i, /技术栈/] },
    { label: "拆解粒度", presentIf: [/模块/, /功能/, /任务/, /里程碑/, /阶段/, /粒度/] },
    { label: "团队规模", presentIf: [/个人/, /团队/, /\d+\s*人/, /分工/] },
    { label: "验收标准", presentIf: [/验收/, /完成标准/, /测试/, /通过/] },
  ],
  survey: [
    { label: "调研主题", presentIf: [/关于/, /主题/, /使用情况/, /满意度/, /需求/] },
    { label: "调研对象", presentIf: [/大学生/, /学生/, /用户/, /教师/, /人群/, /对象/] },
    { label: "样本量", presentIf: [/样本/, /\d+\s*份/, /\d+\s*人/, /发放/] },
    { label: "题型要求", presentIf: [/单选/, /多选/, /量表/, /开放题/, /题型/, /\d+\s*题/] },
    { label: "分析目标", presentIf: [/分析/, /验证/, /比较/, /影响因素/] },
  ],
  writing: [
    { label: "写作主题", presentIf: [/关于/, /主题/, /写/] },
    { label: "目标读者", presentIf: [/给/, /面向/, /读者/, /同学/, /老师/] },
    { label: "发布场景", presentIf: [/公众号/, /演讲/, /推文/, /作业/, /比赛/] },
  ],
  data_analysis: [
    { label: "数据来源", presentIf: [/Excel|CSV|数据|报告/i] },
    { label: "分析目标", presentIf: [/目标/, /结论/, /想看/, /关注/] },
    { label: "关键指标", presentIf: [/指标/, /转化率/, /增长/, /占比/] },
  ],
  learning: [
    { label: "课程主题", presentIf: [/课程/, /知识点/, /科目/, /章节/] },
    { label: "学习阶段", presentIf: [/预习/, /复习/, /备考/, /入门/] },
    { label: "薄弱点", presentIf: [/薄弱/, /不会/, /难点/, /易错/] },
  ],
  presentation: [
    { label: "汇报主题", presentIf: [/主题/, /项目/, /关于/] },
    { label: "听众", presentIf: [/评委/, /老师/, /同学/, /听众/] },
    { label: "时长或页数", presentIf: [/\d+\s*分钟/, /\d+\s*页/, /时长/, /页数/] },
  ],
  business_plan: [
    { label: "产品或服务", presentIf: [/产品/, /服务/, /项目/] },
    { label: "目标客户", presentIf: [/客户/, /用户/, /人群/] },
    { label: "商业模式", presentIf: [/商业模式/, /盈利/, /收入/] },
  ],
  other: [
    { label: "具体目标", presentIf: [/目标/, /想要/, /完成/] },
    { label: "目标受众", presentIf: [/给/, /面向/, /用户/, /同学/] },
    { label: "输出格式", presentIf: [/表格/, /大纲/, /清单/, /报告/, /文案/] },
    { label: "使用场景", presentIf: [/用于/, /场景/, /比赛/, /课堂/] },
  ],
};

const clubActivityRules: MissingInfoRule[] = [
  { label: "活动主题", presentIf: [/关于/, /主题/, /读书会|分享会|比赛|讲座|沙龙/] },
  { label: "参与对象", presentIf: [/新生/, /会员/, /同学/, /全校/, /面向/, /对象/] },
  { label: "时间地点", presentIf: [/时间/, /地点/, /教室/, /线上/, /\d+\s*(月|日|点)/] },
  { label: "活动流程", presentIf: [/流程/, /环节/, /安排/, /游戏/, /议程/] },
  { label: "预算与物料", presentIf: [/预算/, /物料/, /奖品/, /费用/, /海报/] },
  { label: "宣传渠道", presentIf: [/公众号/, /小红书/, /社群/, /海报/, /朋友圈/] },
];

export function detectMissingInfo(input: string, analysis: IntentAnalysis): string[] {
  const text = input.trim();
  const isClubActivity = analysis.taskType === "club_operation" && /活动策划|活动方案|活动/.test(text);
  const rules = isClubActivity ? clubActivityRules : missingRules[analysis.taskType] ?? missingRules.other;
  const template = getTemplate(analysis.taskType);
  const ruleLabels = rules
    .filter((rule) => !rule.presentIf.some((pattern) => pattern.test(text)))
    .map((rule) => rule.label);

  const ruleLabelSet = new Set(rules.map((rule) => rule.label));
  const templateMissing = isClubActivity
    ? []
    : template.requiredInfo.filter((item) => !ruleLabelSet.has(item) && !text.includes(item));
  return [...new Set([...ruleLabels, ...templateMissing])].slice(0, 6);
}
