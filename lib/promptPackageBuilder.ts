import type {
  ClarificationQuestion,
  GeneratePromptOptions,
  IntentAnalysis,
  PromptArtifact,
  PromptPackage,
  PromptPackageMode,
  TargetTool,
} from "./types";

const targetLabels: Record<Exclude<TargetTool, "auto">, string> = {
  general: "通用 AI",
  chatgpt: "ChatGPT",
  claude: "Claude",
  codex: "Codex",
  claude_code: "Claude Code",
  gemini: "Gemini",
  image_generation: "图像生成 AI",
};

const toolPatterns: Array<[Exclude<TargetTool, "auto" | "general">, RegExp]> = [
  ["claude_code", /claude\s*code/i],
  ["codex", /codex/i],
  ["claude", /claude/i],
  ["chatgpt", /chatgpt|gpt-\d|openai/i],
  ["gemini", /gemini/i],
  ["image_generation", /图片\s*prompt|图像\s*prompt|海报|绘图|生成图片|画一张/i],
];

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function detectTargetTools(input: string, selected: TargetTool = "auto"): TargetTool[] {
  if (selected !== "auto") return [selected];

  const detected = toolPatterns
    .filter(([tool, pattern]) => pattern.test(input) && !(tool === "claude" && /claude\s*code/i.test(input) && !/claude(?!\s*code)/i.test(input)))
    .map(([tool]) => tool);
  return detected.length ? [...new Set(detected)] : ["general"];
}

function detectMode(
  input: string,
  analysis: IntentAnalysis,
  tools: TargetTool[],
  selected: PromptPackageMode = "auto",
): PromptPackageMode {
  if (selected !== "auto") return selected;
  if (tools.length > 1 || /一起|协作|合作|分工/.test(input)) return "multi_ai_package";
  if (analysis.taskType === "coding" || tools.some((tool) => tool === "codex" || tool === "claude_code")) {
    return "engineering_package";
  }
  return "single_prompt";
}

function buildQuestions(
  questions: string[],
  answers: Record<string, string> = {},
): ClarificationQuestion[] {
  return questions
    .map((question, index) => ({
      id: `clarification-${index + 1}`,
      field: question.replace(/[？?]$/, ""),
      question,
      required: false,
      defaultAnswer: "按默认假设生成",
    }))
    .filter((question) => !answers[question.id]?.trim());
}

function buildContext(analysis: IntentAnalysis, answers: Record<string, string> = {}): string[] {
  const answerLines = Object.entries(answers)
    .filter(([, value]) => value.trim())
    .map(([field, value]) => `补充信息（${field}）：${value.trim()}`);
  return [analysis.scenario, ...analysis.knownInfo, ...answerLines];
}

function buildSinglePrompt(input: string, analysis: IntentAnalysis, target: TargetTool, context: string[]): string {
  if (target === "image_generation") {
    return [
      "请生成一份可直接用于图像生成 AI 的中文提示词。",
      "",
      `创作目标：${input}`,
      "补充背景：",
      list(context),
      "",
      "请按以下结构输出：",
      "- 主体与动作",
      "- 场景与构图",
      "- 风格、光线、色彩和视觉层级",
      "- 画面中的文字内容与层级（没有则写无）",
      "- 画面比例",
      "- 禁止元素",
      "",
      "要求：只补充合理默认值；未提供的具体文字、人物名称或数据必须用【待补充】标注，不得虚构。",
    ].join("\n");
  }

  if (target === "codex" || target === "claude_code") {
    return [
      `你是 ${targetLabels[target]}。先检查实际代码、配置与测试，再实施以下任务。`,
      "",
      `目标：${input}`,
      "当前上下文：",
      list(context),
      "",
      "执行要求：",
      "- 先说明已确认的当前状态，再做最小必要修改。",
      "- 不无故重写项目，不删除已有工作，不新建分支或 worktree。",
      "- 明确允许修改的文件范围；不确定时优先保留现有行为。",
      "- 完成后运行项目现有的测试、lint 和 build 命令。",
      "",
      "验收标准：目标功能可用、旧流程不回归、验证结果如实报告。",
      "最终报告：改动文件、验证结果、未解决问题（如有）。",
    ].join("\n");
  }

  if (target === "claude") {
    return [
      "请以结构化、可落地的方式完成以下任务。",
      "",
      `任务目标：${input}`,
      "背景：",
      list(context),
      "",
      "请输出：",
      "- 对目标与关键约束的理解",
      "- 可执行方案或成品结构",
      "- 需要权衡的因素及选择理由",
      "- 可直接使用的最终内容",
      "- 自检清单",
      "",
      "未给出的事实、数据和来源必须标为【待补充】；不要只给抽象建议。",
    ].join("\n");
  }

  return [
    `请完成以下任务：${input}`,
    "",
    "背景与已知信息：",
    list(context),
    "",
    "输出要求：",
    `- 产出：${analysis.targetOutput}`,
    "- 先给清晰结构，再给可直接使用的内容。",
    "- 使用中文，表达具体、易修改。",
    "- 未提供的关键信息用【待补充】标注，不编造事实或数据。",
    "- 最后附一份简短自检清单。",
  ].join("\n");
}

function buildAgentMd(input: string, context: string[], tools: TargetTool[]): string {
  return [
    "# AGENT.md",
    "",
    "## 项目目标",
    input,
    "",
    "## 已知上下文",
    list(context),
    "",
    "## 工作范围",
    "只实现与目标直接相关的最小改动；先检查现有代码和文档，保留可用能力。",
    "",
    "## 技术与架构边界",
    "沿用仓库已有技术栈和目录结构；没有明确理由时不新增依赖、不重写架构。",
    "",
    "## 工作优先级",
    "用户当前需求 > 已确认的项目约束 > 当前可用代码 > 个人建议。",
    "",
    "## 编码规则",
    "函数职责单一，输入与错误显式处理，避免重复逻辑和无关重构。",
    "",
    "## 禁止事项",
    "不得删除已有工作、擅自创建分支或 worktree、声称未经验证的完成。",
    "",
    "## 测试要求",
    "完成后运行现有测试、lint 和 build；如某项无法运行，要说明原因。",
    "",
    "## 验收标准",
    "目标功能可用，旧流程不回归，改动范围可追溯。",
    "",
    "## 协作工具",
    `参与工具：${tools.map((tool) => targetLabels[tool as Exclude<TargetTool, "auto">]).join("、")}`,
  ].join("\n");
}

function buildIntegrationPrompt(input: string, tools: TargetTool[]): string {
  return [
    "请整合以下 AI 产物到目标项目。",
    "",
    `项目目标：${input}`,
    `参与工具：${tools.map((tool) => targetLabels[tool as Exclude<TargetTool, "auto">]).join("、")}`,
    "",
    "整合步骤：",
    "- 读取当前代码、AGENT.md 与各工具交付物。",
    "- 以明确用户需求、AGENT.md、当前可用代码的顺序处理冲突。",
    "- 只修改为完成整合必需的文件，并保持兼容性。",
    "- 运行测试、lint 和 build。",
    "",
    "最终报告：采用了哪些产物、修改了哪些文件、验证结果和遗留问题。",
  ].join("\n");
}

function buildFixPrompt(input: string): string {
  return [
    "请修复已经确认的问题，不扩展需求范围。",
    "",
    `关联目标：${input}`,
    "已确认事实：请先复现并记录实际错误、受影响文件和预期行为。",
    "允许范围：只修改修复问题所需的代码、测试和直接相关文档。",
    "禁止事项：不做无关重构、不删除现有功能、不以绕过测试代替修复。",
    "完成条件：补充或更新回归测试，并运行测试、lint、build 后如实报告。",
  ].join("\n");
}

function buildAcceptancePrompt(input: string): string {
  return [
    "请对以下目标执行最终验收，并如实报告未完成项。",
    "",
    `验收目标：${input}`,
    "检查项目：",
    "- 核心功能与边界条件",
    "- API 输入、错误处理与兼容性（如适用）",
    "- 自动化测试",
    "- lint 与 build",
    "- 文档是否反映实际行为",
    "- 敏感信息、隐私与安全边界（如适用）",
    "",
    "输出：通过项、失败项、复现方式、证据与尚未完成事项。不要把未验证内容写成已完成。",
  ].join("\n");
}

export function buildPromptPackage(
  input: string,
  analysis: IntentAnalysis,
  questions: string[],
  options: GeneratePromptOptions = {},
): PromptPackage {
  const answers = options.clarificationAnswers ?? {};
  const tools = detectTargetTools(input, options.targetTool);
  const mode = detectMode(input, analysis, tools, options.packageMode);
  const clarificationQuestions = buildQuestions(questions, answers);
  const answeredContext = Object.fromEntries(
    questions
      .map((question, index) => {
        const id = `clarification-${index + 1}`;
        return [question.replace(/[？?]$/, ""), answers[id] ?? ""];
      })
      .filter(([, answer]) => answer.trim()),
  );
  const context = buildContext(analysis, answeredContext);
  const primaryTool = tools[0];
  const artifacts: PromptArtifact[] = [];

  const add = (artifact: PromptArtifact) => artifacts.push(artifact);
  add({
    id: "main-prompt",
    type: "main_prompt",
    title: mode === "engineering_package" ? "主开发 Prompt" : mode === "multi_ai_package" ? "共享任务说明" : "推荐任务指令",
    description: "这是最适合直接复制给目标 AI 的主要结果。",
    targetTool: primaryTool,
    content: buildSinglePrompt(input, analysis, primaryTool, context),
    recommended: true,
  });

  if (mode === "engineering_package" || mode === "multi_ai_package") {
    add({ id: "agent-md", type: "agent_md", title: "AGENT.md", description: "供编码工具遵守的项目开发约束。", content: buildAgentMd(input, context, tools) });
  }

  if (mode === "multi_ai_package") {
    tools.forEach((tool) => {
      add({
        id: `${tool}-prompt`,
        type: "tool_prompt",
        title: `${targetLabels[tool as Exclude<TargetTool, "auto">]} Prompt`,
        description: "按该工具特点编写的分工指令。",
        targetTool: tool,
        content: buildSinglePrompt(input, analysis, tool, context),
      });
    });
    add({ id: "integration", type: "integration_prompt", title: "整合 Prompt", description: "将不同 AI 的产物合并到同一项目。", content: buildIntegrationPrompt(input, tools) });
  }

  if (mode === "engineering_package" || mode === "multi_ai_package") {
    add({ id: "fix", type: "fix_prompt", title: "修复 Prompt", description: "用于发现明确缺陷后的定向修复。", content: buildFixPrompt(input) });
    add({ id: "acceptance", type: "acceptance_prompt", title: "验收 Prompt", description: "用于最终检查功能与交付质量。", content: buildAcceptancePrompt(input) });
  } else {
    add({ id: "follow-up", type: "follow_up_prompt", title: "后续修改 Prompt", description: "用于在得到初稿后继续调整。", content: `请基于上一版结果继续修改“${input}”。请先列出保留项和修改项；只改我明确提出的部分，未确认的信息保留【待补充】。` });
  }

  return {
    id: `package-${Date.now()}`,
    title: mode === "multi_ai_package" ? "协作任务包" : mode === "engineering_package" ? "项目任务包" : "推荐任务指令",
    summary: `已识别为${targetLabels[primaryTool as Exclude<TargetTool, "auto">]}的${mode === "single_prompt" ? "单任务" : mode === "engineering_package" ? "工程" : "协作"}任务。`,
    mode,
    targetTools: tools,
    recommendedArtifactId: "main-prompt",
    artifacts,
    assumptions: [...analysis.assumptions, ...analysis.missingInfo.map((item) => `未提供${item}，将按默认设置处理。`)],
    clarificationQuestions,
    usageInstructions: ["先复制“推荐任务指令”发送给目标 AI。", "工程或协作任务可按卡片顺序使用其余内容。", "未回答的补充信息会按默认假设处理。"],
  };
}
