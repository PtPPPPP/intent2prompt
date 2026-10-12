# 工作台升级说明

日期：2026-10-13。限定于生成结果工作台，不新增登录、支付、多租户、向量数据库、桌面端或最终任务执行能力。

## 上游研究与许可

参考仓库：[linshenkx/prompt-optimizer](https://github.com/linshenkx/prompt-optimizer)。本轮检查 develop commit `1f8cb19c2e506cb27dfff7fe971f65d71ea65863`，核对以下实现边界：

- [PromptService](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/packages/core/src/services/prompt/service.ts)：优化和按反馈迭代分离，处理单份目标文本；历史由 UI 层管理。
- [HistoryManager](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/packages/core/src/services/history/manager.ts) 与 [记录类型](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/packages/core/src/services/history/types.ts)：版本链、前版本、迭代说明、模型来源和存储上限。
- [CompareService](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/packages/core/src/services/compare/service.ts)：纯文本比较，不应与质量判断混同。
- [评估类型](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/packages/core/src/services/evaluation/types.ts)、UI 中 `usePromptOptimizer` / `usePromptHistory` / `useEvaluation`：用户触发优化、选择版本与上下文评估分别管理。
- 核实 [package.json](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/package.json) 声明 `AGPL-3.0-only`，且 [LICENSE](https://github.com/linshenkx/prompt-optimizer/blob/1f8cb19c2e506cb27dfff7fe971f65d71ea65863/LICENSE) 明确 AGPL v3 only。

本项目只参考工作流，独立实现全部新增代码。没有复制上游代码、模板、默认提示词，没有依赖其模块，没有假设存在稳定 HTTP API 或已发布 npm 包。沿用 Next.js、React、TypeScript，无新增项目依赖，保留本项目 MIT LICENSE。

## 本项目模块

- `lib/workbench.ts`：不可变版本、明确父版本和采用状态、文字变化摘要、Markdown 全版本导出。
- `lib/optimizationGuard.ts`：保守原文保护、明显新增细节检查。可能拒绝等义改写，不能证明语义一致或完全防止提示注入。
- `lib/llmClient.ts` / `app/api/optimize/route.ts`：复用 DeepSeek 服务端传输，分离 system / user 数据，单次调用、超时、异常检查、与生成共享限流。请求日志仅技术字段，不记录完整用户文本、反馈或原始模型错误。
- `lib/history.ts`：v2 本地工作台快照，兼容 v1 输入记录；检查损坏嵌套数据和父版本关系，保存错误可见，拒绝静默覆盖损坏存储。
- `components/TaskWorkbench.tsx` / `app/page.tsx`：默认突出已采用任务指令，版本与结构检查折叠，手机上比较列垂直排列。

模型返回 `model` 时记录响应模型；响应未报告时仅标明请求配置，不能声称已确认实际模型。手动编辑、规则模板和旧记录未知来源分别标记。模型优化失败不会伪造规则优化结果。

## 验证方式

常规检查：`npm test`、`npm run lint`、`npm run build`、`npx tsc --noEmit`。模型单元测试全用 fetch mock，包括超时 signal，不访问付费模型。

规则案例：`node node_modules/vite-node/vite-node.mjs scripts/review-cases.ts`，脚本强制关闭模型。12 案例内容见 `workbench-cases.json`，报告区分结构线索、助手核读和未执行的独立人工验收。既有分类规则会把部分会议总结识别为论文、把部分 API 任务背景识别为校园写作；本轮记录缺陷，没有用结构完整度掩盖语义问题。

交互测试：先以默认规则模式运行 `npm run build`、`npm run start -- -p 3100`，再执行 `node scripts/workbench-e2e.cjs`。此脚本需要可访问的 Playwright（可通过 `PLAYWRIGHT_MODULE_PATH` 指向已有安装）及系统 Edge，未加入项目生产依赖。`E2E_ARTIFACT_DIR` 指定报告、截图和下载文件位置。真实页面使用规则生成；优化接口只在浏览器路由中 mock，服务端处理单独由单元测试验证。

交互覆盖 1440×1000 桌面和 390×844 移动视口：生成、补充信息、编辑、失败保留与重试、版本比较、采用、复制、保存、刷新、任务包及版本 Markdown 导出、删除；额外检查无模型编辑、损坏存储和不可用存储提示。没有真实模型优化实验，没有独立人类效果评审，没有真实移动设备测试。

## 限制与遗留

- 结构检查、原文保护和文本差异都不是质量评审。冲突约束仍需用户解决；新版本可能更差。
- localStorage 仅此浏览器有效，跨标签页同时编辑没有自动合并；保存以最近一次写入为准，写入前读取已有任务列表以保留其他任务。
- 任务最多 40 个版本，不静默删除祖先；达上限请导出并创建新任务。
- 原锁文件生产依赖审计报告 6 项漏洞（1 moderate、4 high、1 critical，包含 Next.js）；本轮没有改依赖。应另行做安全依赖升级及回归验证。
- 没有生产部署、真实模型效果、独立人工案例验收或实机移动端验证。

## 本轮实际结果

- `npm test`：8 个文件、95 项测试通过。`npm run lint`、`npm run build`、TypeScript `tsc --noEmit` 均通过。
- Edge headless 1440×1000 和 390×844 交互通过，页面运行时错误为 0。浏览器端优化使用 API mock，不能据此声称真实模型效果提升。
- 12 个案例完成规则生成与助手核读；独立人类效果核查仍未执行。
- 初始目录没有 Git 元数据，修改前备份到 `C:\program1\coding\intent2prompt-backups\20261013-workbench`。随后按用户明确授权接入其既有 GitHub 仓库；升级前源码与远端内容一致（忽略换行格式）。仅提交本轮范围，未修改 LICENSE 或依赖锁文件。
- 测试日志、生产依赖审计 JSON、截图、Markdown 下载文件和 E2E JSON 报告存于同级备份目录；没有将密钥、个人输入或环境配置提交。
