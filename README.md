# Intent2Prompt

> 把一句模糊的中文意图，「编译」成可直接喂给大模型的高质量 Prompt。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

仓库地址：https://github.com/PtPPPPP/intent2prompt

Intent2Prompt 不是简单的提示词美化工具，而是一个面向中文学生创新场景的「意图到提示词编译器」。系统通过 **意图解析 → 缺失信息检测 → 澄清追问 → 结构化 Prompt 编译 → 质量评估** 的完整闭环，降低普通用户使用 AI 的表达门槛。

输入一句中文短意图（例如「帮我写一个挑战杯项目计划书」），即可获得 3 个不同风格的 Prompt 版本 + 7 维度质量评分，**开箱即用、无需任何 API Key**（默认走 mock 流程）。

## ✨ 核心功能

- 🎯 **意图识别**：自动判定任务类型（挑战杯、社团招新、论文、编程、问卷…共 11 类）
- 🔍 **缺失信息检测**：识别关键缺漏，生成最多 3 条澄清追问
- 🛠 **多版本编译**：一键产出「简洁版 / 专家版 / 比赛·项目版」3 套 Prompt
- 📊 **质量评分**：7 维度 100 分制规则评分，附优缺点与改进建议
- 📋 **一键复制** & **本地历史**：基于 localStorage，无需登录
- 🔌 **LLM 预留入口**：默认规则 / 模板 / mock 链路；已预留 DeepSeek 调用函数，但主生成流程默认不调用真实模型

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18（建议 20+）
- npm

### 安装与运行

```bash
git clone https://github.com/PtPPPPP/intent2prompt.git
cd intent2prompt
npm install
npm run dev
```

浏览器打开 http://localhost:3000 即可使用。

> 💡 默认 `LLM_PROVIDER=mock`，开箱即用，无需任何 API Key。

### LLM 接口状态

当前主生成流程是规则 / 模板 / mock 链路，不需要 API Key 也可以完整运行。项目已在 `lib/llmClient.ts` 中预留统一 LLM 入口，并实现了 DeepSeek 调用函数，但 `lib/intentAnalyzer.ts` 的主流程默认不调用 DeepSeek。

后续可以把真实 LLM 用于低置信度意图增强、追问润色或 Prompt 优化。需要单独测试 LLM 入口时，可复制配置模板并填入 Key：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
LLM_PROVIDER=deepseek                       # 仅用于显式调用 llmClient，不会自动改变主生成流程
DEEPSEEK_API_KEY=sk-xxxxxxxx                # 在 DeepSeek 平台申请
DEEPSEEK_MODEL=deepseek-chat                # 可选，默认 deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com  # 可选，可指向自建网关/代理
```

> ⚠️ OpenAI / Claude provider 目前为占位，**尚未接入**；DeepSeek 入口已存在但未接入主生成流程。不要把 `LLM_PROVIDER=deepseek` 理解为页面生成会自动调用 DeepSeek。

## 🔧 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 以生产模式启动 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run lint` | ESLint 代码检查 |

## 🧰 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Next.js 16（App Router） |
| 语言 | TypeScript 5 |
| UI | React 19、Tailwind CSS 3 |
| 后端 | Next.js Route Handlers |
| 测试 | Vitest |
| 存储 | 浏览器 localStorage |

## 📁 目录结构

```text
app/
  page.tsx                      主页面（输入 + 结果展示）
  api/generate/route.ts         生成接口
  layout.tsx / globals.css
components/                     UI 组件
  IntentInput.tsx               意图输入
  IntentAnalysisCard.tsx        意图解析卡片
  ClarifyingQuestions.tsx       澄清追问
  PromptVersionCard.tsx         Prompt 版本卡片
  EvaluationCard.tsx            质量评分卡片
  HistoryPanel.tsx              历史记录
lib/                            核心逻辑（纯函数，便于单测）
  types.ts                      类型定义
  intentRules.ts                11 类任务规则
  templates.ts                  Prompt 模板
  intentAnalyzer.ts             意图解析 + 流程编排
  missingInfoDetector.ts        缺失信息检测
  questionGenerator.ts          追问生成
  promptSchemaBuilder.ts        结构化 Schema 构建
  promptCompiler.ts             3 模式 Prompt 编译
  promptEvaluator.ts            7 维度评分
  llmClient.ts                  统一 LLM 入口（mock / deepseek）
data/
  examples.ts                   10 条中文测试样例
docs/
  项目立项书.md                  项目设计文档
```

## 🔄 工作流程

```mermaid
flowchart LR
  A[用户输入] --> B[analyzeIntent<br/>意图解析]
  B --> C[detectMissingInfo<br/>缺失信息检测]
  C --> D[generateClarifyingQuestions<br/>澄清追问]
  D --> E[buildPromptSchema<br/>结构化骨架]
  E --> F[compilePromptVersions<br/>3 模式编译]
  F --> G[evaluatePrompt<br/>7 维度评分]
  G --> H[返回结果]
```

## 📡 API 契约

### `POST /api/generate`

**请求体**

```json
{
  "input": "帮我写一个挑战杯项目计划书"
}
```

> 兼容旧字段 `intent`（`input` 与 `intent` 任填其一）。输入为空时返回 `400`。

**响应**（`GeneratePromptResult`）

```ts
{
  originalInput: string;          // 原始输入
  analysis: IntentAnalysis;       // 任务类型 / 目标 / 已知与缺失信息 / 置信度
  clarifyingQuestions: string[];  // 最多 3 条澄清追问
  promptSchema: PromptSchema;     // 结构化提示词骨架
  promptVersions: PromptVersion[];// concise / expert / competition 三个版本
  evaluation: PromptEvaluation;   // 总分 + 7 维度明细 + 优缺点与建议
}
```

7 个评分维度及权重（满分 100）：

| 维度 | 权重 |
| --- | --- |
| taskClarity（任务清晰度） | 20 |
| contextCompleteness（上下文完整性） | 15 |
| outputFormatClarity（输出格式清晰度） | 15 |
| constraintQuality（约束质量） | 15 |
| executability（可执行性） | 15 |
| hallucinationRiskControl（幻觉风险控制） | 10 |
| chineseExpressionQuality（中文表达质量） | 10 |

## 🎯 MVP 当前能力

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

`data/examples.ts` 内置 10 条中文测试样例，并标注期望任务类型与关键缺失信息。

## 🧪 测试

```bash
npm test
```

基于 `data/examples.ts` 中的样例对意图识别、缺失信息检测等核心纯函数进行单元测试。

## 🧠 Claude 设计整合情况

**完整采用：**

- 8 模块闭环思路
- `PromptSchema` 核心字段
- 11 类任务类型
- 5 个重点场景的缺失信息规则
- 3 种 Prompt 编译模式
- 7 维度 100 分规则评分
- 10 条测试样例方向

**简化处理：**

- `MissingField` 和 `ClarifyingQuestion` 未做成复杂对象，MVP 先用字符串数组，方便前端展示与复制。
- LLM 仅保留统一入口，主流程不依赖真实模型，避免没有 API Key 时影响演示。
- 评分器使用规则评分，暂不做语义级模型评审。

## 🗺 后续开发方向

- 支持用户填写追问答案后的二次生成
- 把历史记录从 localStorage 升级为 SQLite
- 让真实 LLM 仅在低置信度或润色阶段介入
- 扩展更多学生场景模板
- 接入 OpenAI / Claude provider

## 🤝 贡献

欢迎提 Issue 与 PR。请确保 `npm test` 与 `npm run lint` 通过。

## 📄 许可

[MIT](LICENSE)
