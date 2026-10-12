export const workbenchCases = [
  { id: "simple-writing", input: "写一封请假邮件，原因待补充", mode: "single_prompt", review: "推荐指令保留待补充项；通用模板缺少独立验收标准，不能直接视为可验证成品。" },
  { id: "simple-summary", input: "总结以下会议记录，会议材料待补充，不得编造参会者", mode: "single_prompt", review: "原始意图和不得编造要求保留，但既有分类规则将会议总结识别为论文总结，产出说明偏题；结构检查未识别此语义问题，需人工修正。" },
  { id: "codex-engineering", input: "让 Codex 修复登录超时，沿用 Next.js，不新增依赖", mode: "engineering_package", review: "主开发、AGENT.md、修复、验收卡片齐备；没有仓库材料，需按实际代码补充复现和测试证据。" },
  { id: "claude-code", input: "用 Claude Code 为现有 API 增加错误处理，不重写架构", mode: "engineering_package", review: "目标工具与原始边界保留，Claude Code 不再重复识别为 Claude；但既有意图规则给出校园写作背景，需用户修正，实际 API 契约待补充。" },
  { id: "multi-ai", input: "让 Codex 和 Claude 协作开发报名系统，Claude 给方案，Codex 写代码", mode: "multi_ai_package", review: "生成共享说明、工具指令和整合卡片；各工具卡片仍是通用任务模板，尚不能保证细致分工效果。" },
  { id: "multi-ai-review", input: "让 Gemini 和 Codex 协作审查现有页面，不删除已有功能", mode: "multi_ai_package", review: "保留禁止删除边界并生成整合指令；审查职责仍需用户核对，不代表实际调用 Gemini 或 Codex。" },
  { id: "missing-paper", input: "总结具身智能论文，论文正文和来源待补充", mode: "single_prompt", review: "论文与来源缺口保留；不能验证论文结论或引用。" },
  { id: "missing-data", input: "分析销售数据，数据文件待补充，不编造收益", mode: "single_prompt", review: "待补充数据与不编造要求保留；规则输出不是实际数据分析结果。" },
  { id: "known-budget", input: "用 Codex 修改现有报名表，预算 500 元，截止日期 2026-11-01，不新增服务", mode: "engineering_package", review: "已知预算和日期作为原始意图保留；模型不得改写这些原文，也不能新增技术选择。" },
  { id: "conflicting-deploy", input: "让 Codex 修复发布脚本，禁止部署；必须部署到生产环境", mode: "engineering_package", review: "冲突原文保留，结构检查提示可能冲突；用户必须决定是否部署，不能把此包直接视为无歧义任务。" },
  { id: "conflicting-dependency", input: "让 Codex 修改验证逻辑，不得新增依赖；必须新增依赖实现", mode: "engineering_package", review: "相互冲突的依赖要求均保留；需要用户澄清，不由模板自行选择。" },
  { id: "no-stack", input: "让 Codex 开发一个个人记账页面，技术栈和部署位置待补充", mode: "engineering_package", review: "未指定技术栈保持待补充；工程模板要求检查现有代码，没有具体仓库时仍需补充材料。" },
] as const;
