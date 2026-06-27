# AGENT.md

## Project Name

**Intent2Prompt**

## Project Goal

Intent2Prompt is a Chinese intent-to-prompt generation system.

The user provides a short natural-language intention, such as:

* 帮我写一个挑战杯项目计划书
* 帮我做社团招新文案
* 帮我总结一篇论文
* 帮我设计一个调查问卷
* 帮我拆解一个编程项目需求

The system should analyze the user's intent, detect missing information, generate clarifying questions, compile structured prompts, and provide multiple prompt versions that can be copied and used with an AI model.

This project is intended for Chinese university students, student clubs, research training, innovation competitions, and AI productivity scenarios.

---

## Core Principle

Do not build a generic chatbot.

Do not build only a simple prompt beautifier.

This project must focus on the following closed loop:

```text
User Short Intent
  -> Intent Analysis
  -> Missing Information Detection
  -> Clarifying Questions
  -> Prompt Schema Construction
  -> Prompt Compilation
  -> Prompt Quality Evaluation
  -> Reusable Prompt Asset
```

Every major feature should support this loop.

---

## MVP Scope

The first version must prioritize a working MVP.

The MVP should include:

1. A homepage with a Chinese intent input box.
2. Example intent buttons.
3. Intent analysis result display.
4. Missing information detection.
5. Up to 3 clarifying questions.
6. Three generated prompt versions:

   * 简洁版
   * 专家版
   * 比赛/项目版
7. Copy-to-clipboard support.
8. Basic history records.
9. Mock LLM mode so the project can run without API keys.
10. README with setup and usage instructions.

Do not add complex features before the MVP is complete.

---

## Recommended Tech Stack

Use the following stack unless there is a strong reason not to:

* Framework: Next.js
* Language: TypeScript
* Styling: Tailwind CSS
* Backend: Next.js API Routes or Server Actions
* Storage: local JSON, localStorage, or SQLite for MVP
* LLM integration: abstracted through a unified `llmClient`
* Deployment target: Vercel-compatible

The project should be easy for a student team to understand, run, and extend.

---

## Required Directory Structure

Prefer this structure:

```text
intent2prompt/
  app/
    page.tsx
    api/
      generate/
        route.ts

  components/
    IntentInput.tsx
    IntentAnalysisCard.tsx
    ClarifyingQuestions.tsx
    PromptVersionCard.tsx
    HistoryPanel.tsx
    EvaluationCard.tsx

  lib/
    types.ts
    llmClient.ts
    intentAnalyzer.ts
    missingInfoDetector.ts
    questionGenerator.ts
    promptSchemaBuilder.ts
    promptCompiler.ts
    promptEvaluator.ts
    templates.ts
    intentRules.ts

  data/
    examples.ts

  public/

  README.md
  AGENT.md
  .env.example
```

Do not put all logic inside `app/page.tsx`.

Core logic must be separated into `lib/`.

UI components must be separated into `components/`.

---

## Core Modules

### 1. Intent Analyzer

Purpose:

Analyze the user's short Chinese intent.

Input:

```ts
string
```

Output:

```ts
IntentAnalysis
```

Responsibilities:

* Detect task type.
* Infer user goal.
* Infer target output.
* Infer usage scenario.
* Extract known information.
* Mark uncertain assumptions.

Do not overcomplicate this module in MVP.
Rule-based classification plus mock LLM output is acceptable.

---

### 2. Missing Info Detector

Purpose:

Detect information missing from the user's intent.

Example:

User input:

```text
帮我写社团招新文案
```

Possible missing information:

```text
社团名称、面向人群、发布平台、文案风格、字数要求、是否需要标题
```

Responsibilities:

* Use task-specific rules.
* Return only important missing fields.
* Avoid asking too many questions.
* Prioritize fields that directly affect prompt quality.

---

### 3. Clarifying Question Generator

Purpose:

Generate at most 3 useful clarifying questions.

Rules:

* Questions must be short.
* Questions must be in Chinese.
* Questions must be directly useful for improving the final prompt.
* Do not ask obvious or unnecessary questions.
* If enough information is available, return an empty list.

Bad example:

```text
你还有什么其他要求吗？
```

Good example:

```text
这个文案主要发布在哪个平台，比如公众号、小红书还是社群？
```

---

### 4. Prompt Schema Builder

Purpose:

Convert intent analysis and missing information into a structured prompt schema.

The schema should include:

```ts
{
  role: string;
  task: string;
  context: string;
  input: string;
  constraints: string[];
  outputFormat: string[];
  qualityCriteria: string[];
  examples?: string[];
  clarifyingQuestions?: string[];
  assumptions?: string[];
  safetyNotes?: string[];
}
```

The schema is the internal representation of a high-quality prompt.

---

### 5. Prompt Compiler

Purpose:

Compile the prompt schema into final user-facing prompts.

The compiler must generate at least three versions:

1. **简洁版**
   Suitable for quick AI usage.

2. **专家版**
   More detailed, higher-quality, with clear role, constraints, and output format.

3. **比赛/项目版**
   Suitable for Challenge Cup, innovation competitions, student club projects, research training, and project planning.

Each version should be readable, structured, and directly copyable.

---

### 6. Prompt Evaluator

Purpose:

Evaluate the quality of the generated prompt.

MVP evaluation can be rule-based.

Scoring dimensions:

* Task clarity
* Context completeness
* Output format clarity
* Constraint quality
* Executability
* Hallucination risk control
* Chinese expression quality

Output example:

```ts
{
  score: 86,
  dimensionScores: {
    taskClarity: 18,
    contextCompleteness: 14,
    outputFormatClarity: 15,
    constraintQuality: 13,
    executability: 14,
    hallucinationRiskControl: 6,
    chineseExpressionQuality: 6
  },
  strengths: [],
  weaknesses: [],
  suggestions: []
}
```

Do not block MVP development on a complex evaluator.

---

### 7. Template Library

Purpose:

Provide reusable task templates.

The first version must cover at least:

1. 挑战杯项目计划书
2. 社团招新文案
3. 论文总结
4. 编程项目需求拆解
5. 调查问卷设计

Each template should define:

* task type
* required information
* recommended role
* recommended output format
* common constraints
* quality criteria
* prompt pattern

---

## Task Types

The first version should support these task types:

```ts
type TaskType =
  | "project_planning"
  | "club_operation"
  | "writing"
  | "academic_paper"
  | "coding"
  | "data_analysis"
  | "survey"
  | "learning"
  | "presentation"
  | "business_plan"
  | "other";
```

Chinese labels can be displayed in the UI.

Do not create too many categories in the MVP.

---

## Data Types

Create clear TypeScript types in `lib/types.ts`.

Required core types:

```ts
export type TaskType =
  | "project_planning"
  | "club_operation"
  | "writing"
  | "academic_paper"
  | "coding"
  | "data_analysis"
  | "survey"
  | "learning"
  | "presentation"
  | "business_plan"
  | "other";

export type PromptMode = "concise" | "expert" | "competition";

export interface IntentAnalysis {
  taskType: TaskType;
  userGoal: string;
  targetOutput: string;
  scenario: string;
  knownInfo: string[];
  missingInfo: string[];
  assumptions: string[];
  confidence: number;
}

export interface PromptSchema {
  role: string;
  task: string;
  context: string;
  input: string;
  constraints: string[];
  outputFormat: string[];
  qualityCriteria: string[];
  examples?: string[];
  clarifyingQuestions?: string[];
  assumptions?: string[];
  safetyNotes?: string[];
}

export interface PromptVersion {
  mode: PromptMode;
  title: string;
  description: string;
  content: string;
}

export interface PromptEvaluation {
  score: number;
  dimensionScores: {
    taskClarity: number;
    contextCompleteness: number;
    outputFormatClarity: number;
    constraintQuality: number;
    executability: number;
    hallucinationRiskControl: number;
    chineseExpressionQuality: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface GeneratePromptResult {
  originalInput: string;
  analysis: IntentAnalysis;
  clarifyingQuestions: string[];
  promptSchema: PromptSchema;
  promptVersions: PromptVersion[];
  evaluation: PromptEvaluation;
}
```

---

## UI Requirements

The UI should be simple, clean, and suitable for demo.

Required sections:

1. Header
   Show project name and short description.

2. Intent Input Area
   Large input box for Chinese short intent.

3. Example Buttons
   Provide clickable examples.

4. Intent Analysis Card
   Show task type, user goal, target output, scenario, missing information, and assumptions.

5. Clarifying Questions Card
   Show up to 3 questions.

6. Prompt Version Cards
   Show concise, expert, and competition versions.

7. Evaluation Card
   Show prompt quality score and suggestions.

8. History Panel
   Show previous inputs and generated prompts.

Avoid unnecessary animations or complex visual effects before the core flow works.

---

## LLM Integration Rules

The project must support mock mode first.

Create `lib/llmClient.ts`.

It should expose a unified interface such as:

```ts
export async function generateWithLLM(prompt: string): Promise<string>
```

The implementation should support:

1. Mock mode
2. Future OpenAI API
3. Future Claude API

Use environment variables:

```text
LLM_PROVIDER=mock
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Do not hardcode API keys.

Do not require real API keys to run the MVP.

---

## Coding Rules

Follow these rules strictly:

1. Use TypeScript.
2. Keep functions small and readable.
3. Separate business logic from UI.
4. Do not over-engineer.
5. Do not add authentication in MVP.
6. Do not add payment features.
7. Do not add team collaboration features before MVP.
8. Do not add vector databases before MVP.
9. Do not add browser plugins before MVP.
10. Do not add complex agent workflows before MVP.
11. Do not rewrite the whole architecture without reason.
12. Do not delete existing working features unless necessary.
13. Keep Chinese UX text clear and natural.
14. Ensure the project can run locally.
15. Update README when adding major functionality.

---

## What Not To Build Yet

Do not build these features in the first MVP:

* User login
* Subscription or payment
* Multi-user workspace
* Prompt marketplace
* Browser extension
* Mobile app
* Vector database
* RAG knowledge base
* Complex agent orchestration
* Fine-tuning pipeline
* Cloud database requirement
* Admin dashboard
* Social sharing platform
* Full competition management system

These can be considered after the MVP is stable.

---

## Acceptable MVP Shortcuts

The MVP may use:

* Rule-based intent classification
* Hardcoded templates
* Local mock responses
* LocalStorage history
* Simple JSON-based templates
* Rule-based prompt scoring
* Static example inputs

These are acceptable as long as the core product flow is complete.

---

## Quality Bar

Before considering a task complete, verify:

1. The project starts without errors.
2. The homepage loads successfully.
3. A user can input a Chinese short intent.
4. The system returns structured intent analysis.
5. The system detects missing information.
6. The system generates at most 3 clarifying questions.
7. The system generates 3 prompt versions.
8. The user can copy generated prompts.
9. The generated prompts are useful and readable.
10. The README explains how to run the project.

---

## Demo Examples

The project should support these test inputs:

```text
帮我写一个挑战杯项目计划书
```

```text
帮我做一个 AI 编程社团的招新文案
```

```text
帮我总结一篇关于具身智能的论文
```

```text
帮我设计一个关于大学生 AI 使用情况的调查问卷
```

```text
帮我拆解一个 prompt 生成器项目的开发需求
```

```text
帮我做一个创新创业比赛的商业计划书大纲
```

```text
帮我生成一份社团活动策划案
```

```text
帮我把课程知识点整理成复习提纲
```

```text
帮我分析一份数据报告
```

```text
帮我做一页项目路演 PPT 的内容结构
```

---

## Competition Positioning

When writing README, documentation, or project descriptions, use this positioning:

**Intent2Prompt is not a simple prompt beautifier. It is a Chinese intent-to-prompt compiler for student innovation scenarios. It builds a closed loop of intent analysis, missing information detection, structured prompt compilation, quality evaluation, and prompt asset reuse.**

Chinese version:

**Intent2Prompt 不是简单的提示词美化工具，而是一个面向中文学生创新场景的“意图到提示词编译器”。系统通过意图解析、缺失信息检测、结构化 Prompt 编译、质量评估和提示词资产管理，降低普通用户使用 AI 的表达门槛。**

---

## Development Priority

Follow this order:

1. Build the static UI.
2. Define TypeScript types.
3. Implement rule-based intent analysis.
4. Implement missing information detection.
5. Implement clarifying question generation.
6. Implement prompt schema builder.
7. Implement prompt compiler.
8. Implement mock API route.
9. Implement copy and history features.
10. Implement prompt evaluation.
11. Improve templates.
12. Add real LLM provider support later.

Do not start with real LLM API integration before the mock flow is complete.

---

## Final Reminder

The goal is not to make the biggest system.

The goal is to make a clear, runnable, demonstrable MVP that proves this idea:

```text
A short Chinese intention can be transformed into a structured, high-quality, reusable AI prompt.
```
