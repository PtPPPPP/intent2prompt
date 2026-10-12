export interface ProtectedContext {
  goal: string;
  targetTools: string[];
  lockedLines: string[];
}

// 保守提取：明确目标、已知上下文、禁止事项和未知项按原文保护。
// 精确匹配可能拒绝等义改写，不能据此证明语义完全一致。
export function protectedLines(content: string): string[] {
  let inContext = false;
  return [...new Set(content.split("\n").map((line) => line.trim()).filter((line) => {
    if (!line) { inContext = false; return false; }
    if (/^(当前上下文|背景与已知信息|补充背景|背景|执行要求|输出要求|## 已知上下文|## 项目目标|## 工作范围|## 技术与架构边界|## 禁止事项|## 编码规则|## 工作优先级)(?:[:：]\s*)?$/.test(line)) { inContext = true; return false; }
    return inContext || /目标[:：]|原始意图[:：]|参与工具[:：]|协作工具|不得|禁止|不能|不允许|不要|不删除|不新建|不新增|不编造|未提供|未确认|待补充|已知|预算|截止|技术栈|必须|仅限|只能|至少|最多|\b(?:must|only|do not|budget|deadline|known|unknown|TODO)\b/i.test(line);
  }))];
}

export function buildProtectedContext(goal: string, targetTools: string[], original: string, selected: string): ProtectedContext {
  const labels: Record<string, string> = { codex: "Codex", claude_code: "Claude Code", claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", image_generation: "图像生成 AI", general: "通用 AI" };
  const toolLines = (value: string) => value.split("\n").filter((line) => targetTools.some((tool) => line.toLowerCase().includes((labels[tool] ?? tool).toLowerCase()))).map((line) => line.trim());
  return { goal, targetTools, lockedLines: [...new Set([...protectedLines(original), ...protectedLines(selected), ...toolLines(original), ...toolLines(selected)])] };
}

export function suspiciousAdditions(before: string, after: string): string[] {
  // 只拦截明显新增，其余交给人工核查。
  const signals = /\b(?:Next\.js|React|Vue|Angular|TypeScript|Python|Django|FastAPI|PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes)\b|(?:预算|截止日期|截止时间)\s*[:：]?\s*[^\n。；]+|\d+(?:\.\d+)?\s*(?:元|万元|美元|天内|小时内)|\d{4}[-/]\d{1,2}[-/]\d{1,2}|已(?:实现|完成|上线|部署)[^\n。；]*/gi;
  return [...new Set(after.match(signals) ?? [])].filter((signal) => !before.toLowerCase().includes(signal.toLowerCase()) && !/待补充|未确认/.test(signal));
}

export function checkProtectedContent(content: string, context: ProtectedContext): string[] {
  const compact = (value: string) => value.replace(/\s+/g, "");
  const text = compact(content);
  return context.lockedLines.filter((line) => !text.includes(compact(line)));
}

export const REVIEW_NOTICE = "待核查：仅检查受保护原文是否保留，无法证明语义完全一致；请人工核对目标、工具、事实、未知项和新增细节。";
