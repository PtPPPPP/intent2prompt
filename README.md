# Intent2Prompt

Intent2Prompt 不是简单的提示词美化工具，而是一个面向中文学生创新场景的“意图到提示词编译器”。系统通过意图解析、缺失信息检测、结构化 Prompt 编译、质量评估和提示词资产管理，降低普通用户使用 AI 的表达门槛。

## 核心功能

- 输入一句中文短意图，例如“帮我写一个挑战杯项目计划书”
- 自动识别任务类型
- 检测关键缺失信息
- 生成最多 3 个追问
- 编译 3 个 Prompt 版本：简洁版、专家版、比赛/项目版
- 展示 Prompt 质量评分
- 支持一键复制
- 使用 localStorage 保存简单历史记录
- 默认规则 + mock 流程，无需真实 API key

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Next.js API Routes
- Vitest
- 浏览器 localStorage

## 目录结构

```text
app/
  page.tsx
  api/generate/route.ts
components/
  IntentInput.tsx
  IntentAnalysisCard.tsx
  ClarifyingQuestions.tsx
  PromptVersionCard.tsx
  HistoryPanel.tsx
  EvaluationCard.tsx
lib/
  types.ts
  intentRules.ts
  templates.ts
  intentAnalyzer.ts
  missingInfoDetector.ts
  questionGenerator.ts
  promptSchemaBuilder.ts
  promptCompiler.ts
  promptEvaluator.ts
  llmClient.ts
data/
  examples.ts
docs/
  项目立项书.md
```

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 常用命令

```bash
npm test
npm run lint
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```text
LLM_PROVIDER=mock
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

当前主流程不依赖真实 LLM。`lib/llmClient.ts` 保留统一入口，后续可接入 OpenAI、Claude 或兼容 OpenAI 协议的模型服务。

## API 契约

接口：

```text
POST /api/generate
```

请求体支持新字段 `input`，也兼容旧字段 `intent`：

```json
{
  "input": "帮我写一个挑战杯项目计划书"
}
```

返回：

```ts
GeneratePromptResult
```

流程：

```text
用户输入
-> analyzeIntent
-> detectMissingInfo
-> generateClarifyingQuestions
-> buildPromptSchema
-> compilePromptVersions
-> evaluatePrompt
-> 返回结果
```

## MVP 当前能力

已覆盖以下任务类型：

- 挑战杯项目计划书
- 社团招新文案
- 论文总结
- 编程项目需求拆解
- 调查问卷设计
- 学习复习提纲
- 数据报告分析
- 项目路演 PPT
- 商业计划书
- 通用写作和其他任务

`data/examples.ts` 内置 10 条中文测试样例，并标注期望任务类型和关键缺失信息。

## Claude 设计整合情况

完整采用：

- 8 模块闭环思路
- `PromptSchema` 核心字段
- 11 类任务类型
- 5 个重点场景的缺失信息规则
- 3 种 Prompt 编译模式
- 7 维度 100 分规则评分
- 10 条测试样例方向

简化处理：

- `MissingField` 和 `ClarifyingQuestion` 未做成复杂对象，MVP 先用字符串数组，方便前端展示和复制。
- LLM 只保留统一入口，不参与主流程，避免没有 API key 时影响演示。
- 评分器使用规则评分，不做语义级模型评审。

## 后续开发方向

- 增加用户填写追问答案后的二次生成
- 把历史记录从 localStorage 升级为 SQLite
- 让真实 LLM 只在低置信度或润色阶段介入
- 扩展更多学生场景模板
