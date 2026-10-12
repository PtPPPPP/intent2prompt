# 工作台代表性案例

记录日期：2026-10-13。12 个案例全部使用规则生成；没有真实模型实验。结构检查仅检测文字线索。内容核读由助手完成，独立人类核查尚未执行，不能据此声称模型效果提升。

| 案例 | 输入 | 实际模式 / 目标工具 | 结构问题 | 助手核读与人工待核查事项 | 独立人工验收 |
| --- | --- | --- | --- | --- | --- |
| simple-writing | 写一封请假邮件，原因待补充 | single_prompt / general | 仍有未确认信息，请补充或核对默认假设。 | 推荐指令保留待补充项；通用模板缺少独立验收标准，不能直接视为可验证成品。 | 未执行 |
| simple-summary | 总结以下会议记录，会议材料待补充，不得编造参会者 | single_prompt / general | 仍有未确认信息，请补充或核对默认假设。 | 原始意图和不得编造要求保留，但既有分类规则将会议总结识别为论文总结，产出说明偏题；结构检查未识别此语义问题，需人工修正。 | 未执行 |
| codex-engineering | 让 Codex 修复登录超时，沿用 Next.js，不新增依赖 | engineering_package / codex | 未检出缺项，仍需核查 | 主开发、AGENT.md、修复、验收卡片齐备；没有仓库材料，需按实际代码补充复现和测试证据。 | 未执行 |
| claude-code | 用 Claude Code 为现有 API 增加错误处理，不重写架构 | engineering_package / claude_code | 未检出缺项，仍需核查 | 目标工具与原始边界保留，Claude Code 不再重复识别为 Claude；但既有意图规则给出校园写作背景，需用户修正，实际 API 契约待补充。 | 未执行 |
| multi-ai | 让 Codex 和 Claude 协作开发报名系统，Claude 给方案，Codex 写代码 | multi_ai_package / codex、claude | 未检出缺项，仍需核查 | 生成共享说明、工具指令和整合卡片；各工具卡片仍是通用任务模板，尚不能保证细致分工效果。 | 未执行 |
| multi-ai-review | 让 Gemini 和 Codex 协作审查现有页面，不删除已有功能 | multi_ai_package / codex、gemini | 未检出缺项，仍需核查 | 保留禁止删除边界并生成整合指令；审查职责仍需用户核对，不代表实际调用 Gemini 或 Codex。 | 未执行 |
| missing-paper | 总结具身智能论文，论文正文和来源待补充 | single_prompt / general | 仍有未确认信息，请补充或核对默认假设。 | 论文与来源缺口保留；不能验证论文结论或引用。 | 未执行 |
| missing-data | 分析销售数据，数据文件待补充，不编造收益 | single_prompt / general | 仍有未确认信息，请补充或核对默认假设。 | 待补充数据与不编造要求保留；规则输出不是实际数据分析结果。 | 未执行 |
| known-budget | 用 Codex 修改现有报名表，预算 500 元，截止日期 2026-11-01，不新增服务 | engineering_package / codex | 未检出缺项，仍需核查 | 已知预算和日期作为原始意图保留；模型不得改写这些原文，也不能新增技术选择。 | 未执行 |
| conflicting-deploy | 让 Codex 修复发布脚本，禁止部署；必须部署到生产环境 | engineering_package / codex | 可能存在相互冲突的约束，请人工核查。 | 冲突原文保留，结构检查提示可能冲突；用户必须决定是否部署，不能把此包直接视为无歧义任务。 | 未执行 |
| conflicting-dependency | 让 Codex 修改验证逻辑，不得新增依赖；必须新增依赖实现 | engineering_package / codex | 可能存在相互冲突的约束，请人工核查。 | 相互冲突的依赖要求均保留；需要用户澄清，不由模板自行选择。 | 未执行 |
| no-stack | 让 Codex 开发一个个人记账页面，技术栈和部署位置待补充 | engineering_package / codex | 仍有未确认信息，请补充或核对默认假设。 | 未指定技术栈保持待补充；工程模板要求检查现有代码，没有具体仓库时仍需补充材料。 | 未执行 |

完整原稿与结构结果见 [workbench-cases.json](workbench-cases.json)。可运行 `node node_modules/vite-node/vite-node.mjs scripts/review-cases.ts` 重新生成报告（始终禁用模型）。
