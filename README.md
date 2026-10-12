# Intent2Prompt

Intent2Prompt 把一句简短意图转换为可直接发送给 AI 的推荐任务指令。软件开发和多 AI 协作场景会额外生成可复制的任务包，而不会替用户执行最终任务。

## 意图到可验证任务指令的工作台（本轮 MVP）

保留“一句话意图 → 最多三个澄清问题 → 推荐任务指令 / 工程任务包”，加入“编辑 → 按反馈优化一次 → 比较版本 → 选择采用 → 保存和导出”。

- 可以选择任务包中的任意一份指令编辑；原稿保留，编辑稿和模型结果作为新版本。上方任务包、复制与导出使用明确采用的版本。
- 可比较原稿或其他版本，查看增删原文、父版本、反馈、时间和实际模型来源；不会根据分数或长度宣布新版本胜出。
- 当前实际调用只支持服务端 DeepSeek。“目标 AI”是指令接收工具，选 Codex / Claude / Gemini 不表示服务端调用这些模型。未启用 DeepSeek 时仍可编辑、比较、采用、保存和导出，模型优化按钮准确显示不可用。
- 优化使用独立系统消息与 JSON 数据边界，只发送所选指令、反馈、目标与受保护原文。明显丢失关键原文、空结果、非法响应、明显新增技术栈 / 金额 / 日期 / 完成声明会被拒绝；检查无法证明语义完全一致，采用前需要人工核查。
- 每次点击最多一次模型优化调用，无自动迭代；与生成共用限流、统一错误响应及 `requestId`。失败保留版本、编辑稿与反馈。
- 保存到此浏览器包含任务包、所有版本、采用状态、编辑稿和反馈；刷新恢复最近保存的工作台。最多 6 个任务、每任务 40 个版本、总计约 200 万字符。第 7 个任务替换最早记录；超容量或存储失败提示导出备份。支持删除、清空和 v1 输入历史迁移，损坏记录不静默覆盖。
- “结构检查”只检查目标、背景、输出、约束、验收等文字线索；不能验证任务执行效果。本轮没有增加模型评审或自动执行用户任务。

`POST /api/optimize` 接收 `{ content, original, feedback, goal, targetTools }`：所选文本 / 原稿为 1–20000 字，反馈为 1–1000 字，目标为 1–1000 字。`GET /api/optimize` 只报告服务端模型可用状态，不返回密钥。优化不可用返回 503，明显约束丢失返回 422，异常模型响应返回 502，超时返回 504，限流返回 429 并附 `Retry-After`。

上游参考、验证边界与运行交互测试见 [工作台升级说明](docs/workbench-upgrade.md)；12 个规则模式案例及待人工核查事项见 [案例报告](docs/workbench-cases.md)。

当前主流程支持：

- 自动识别或手动选择目标 AI：通用 AI、ChatGPT、Claude、Codex、Claude Code、Gemini、图像生成 AI。
- 自动判断单任务、工程任务包和多 AI 协作包。
- 生成推荐任务指令、AGENT.md、整合、修复和验收 Prompt。
- 最多三个关键补充问题；留空即可使用默认假设。
- 单项复制、复制整个任务包、导出 Markdown；技术细节默认折叠。

## v0.4.1 Pilot Hardening 状态

v0.4.1 已加入统一 API 响应、匿名客户端哈希、内存与 Redis REST 兼容限流，以及 Redis 故障策略。它只适合 10–30 人的小范围内测，不适合公开收费商用。

- 成功和失败响应均包含 `requestId`；`429` 同时返回 `Retry-After` 和 `retryAfter`。
- `RATE_LIMIT_STORE=memory` 仅适用于本地、测试或单实例内测；多实例请使用 Redis REST-compatible HTTP 服务。
- Redis 故障时，`fallback-memory` 会切换到内存限流并使健康检查显示降级；`deny` 会让生成和反馈接口返回 `503`。
- 不记录用户完整输入、完整 Prompt、原始 IP 或原始匿名客户端 ID。启用 DeepSeek 时，待润色 Prompt 会发送给该模型服务。

当前版本是可控内测版，不是完整商用产品。

- 默认使用规则、模板和 mock 链路，不需要 API Key 即可完整演示。
- 可选启用 DeepSeek，对规则链路生成的三份 Prompt 做润色增强。
- DeepSeek 不接管意图识别、评分或整体系统；模型未配置或调用失败时，会自动返回原始规则结果。
- 当前没有账号、支付、订阅、云端历史记录或服务端数据库。
- 请不要输入敏感个人信息、账号密码、未公开资料或商业机密。

详细边界、部署说明和依赖风险见 [v0.3 Beta 说明](docs/beta-readiness.md)。

## 快速开始

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 可选启用 DeepSeek

复制配置模板：

```bash
copy .env.example .env.local
```

默认配置如下，保持该配置即可运行规则模式：

```env
LLM_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

如需使用增强模式，将 `LLM_PROVIDER` 改为 `deepseek` 并填入 `DEEPSEEK_API_KEY`。系统只在已有规则结果的基础上润色 Prompt；未配置 Key、网络异常或模型返回异常时，前端会显示已降级为规则模式，接口仍返回可用结果。

不要将 `.env.local` 或 API Key 提交到仓库。

## 核心流程

```text
用户短意图
  -> 意图分析
  -> 缺失信息检测
  -> 最多 3 个澄清问题
  -> 结构化 Prompt
  -> 三种 Prompt 版本
  -> 规则评分
  -> 可选 DeepSeek 润色
```

## API

`POST /api/generate`

```json
{
  "input": "让 Codex 开发一个社团报名系统",
  "targetTool": "auto",
  "packageMode": "auto",
  "clarificationAnswers": {
    "clarification-1": "网页应用"
  }
}
```

也兼容旧字段 `intent`。输入去除首尾空白后必须为 1–1000 个字符；无效输入返回 `400`。

`input` 是唯一必填字段，仍兼容旧字段 `intent`。响应以 `package` 为主要结果，并为旧页面和调用方保留原有分析、三版 Prompt 与评分字段：

```ts
providerStatus: "mock" | "deepseek" | "fallback"
providerMessage?: string
```

`fallback` 表示 DeepSeek 不可用，结果已安全降级为规则模式。

## 验证命令

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## 商用前仍需补齐

- 登录与身份体系
- 服务端用量控制与限流
- 支付和订阅
- 服务端存储与备份
- 正式隐私政策
- 监控告警与安全审计

## 许可证

[MIT](LICENSE)
