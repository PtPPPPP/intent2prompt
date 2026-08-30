# AGENT.md

## 1. Project Name

**Intent2Prompt**

中文名称可暂定为：

**意图到任务包生成器**

---

## 2. Product Definition

Intent2Prompt is a tool that converts a short, vague user intention into a structured, directly usable AI task package.

The product does not execute the final task for the user.

The product does not attempt to replace ChatGPT, Claude, Codex, Gemini, or other AI tools.

Its responsibility is to help users prepare better instructions for those tools.

Core flow:

```text
用户简短描述意图
→ 系统识别任务和目标工具
→ 自动补全可合理推断的信息
→ 必要时提出少量关键问题
→ 生成可直接复制使用的 Prompt 或任务包
→ 用户发送给目标 AI
```

The project should reduce the user's work in:

* organizing requirements
* writing prompts
* splitting complex tasks
* assigning work between multiple AI tools
* defining output formats
* defining constraints
* defining acceptance criteria
* writing follow-up prompts
* writing integration and review prompts

---

## 3. Core Product Goal

The primary product goal is:

> Turn a short intention into a complete, practical, reusable AI instruction package with minimal user effort.

The product should help a user move from:

```text
我大概知道想做什么，但不知道怎么和 AI 说
```

to:

```text
我已经得到一份可以直接发送给 AI 的完整任务指令
```

The product must optimize for:

* fewer user inputs
* fewer clarification questions
* less manual requirement writing
* less prompt editing
* less repeated explanation
* better AI task coordination
* faster copy-and-use workflow

---

## 4. What This Product Is Not

Intent2Prompt is not:

* a general AI chatbot
* a ChatGPT replacement
* an AI answer-generation platform
* a full project management platform
* a Prompt marketplace
* a multi-agent execution system
* an autonomous coding agent
* a workflow automation platform
* a generic Prompt beautifier
* a tool that only makes prompts longer
* a system that exposes Prompt engineering terminology to ordinary users

Do not turn the project into:

```text
用户输入任务
→ 本产品调用模型
→ 本产品直接完成所有任务
```

The default product output must remain a Prompt or task package that the user can send to another AI tool.

Real LLM calls may be used internally to improve generated instructions, but the product itself should not become the final task executor.

---

## 5. Core User Groups

The first version should primarily serve:

* university students
* student clubs
* AI Coding beginners
* student innovation teams
* competition teams
* users who work with ChatGPT, Claude, Codex, Gemini, and image-generation tools
* users who know what they want but cannot clearly describe it to AI

Typical user inputs:

```text
帮我让 Codex 开发一个社团报名系统
```

```text
我想让 Claude 帮我设计一个项目架构
```

```text
我想让 Codex 和 Claude 同时开发一个项目
```

```text
帮我写一个适合微信公众号的 Prompt
```

```text
帮我生成一个项目验收 Prompt
```

```text
我想让 AI 帮我分析一篇论文
```

---

## 6. Core Product Modes

The project should support three main product modes.

---

### 6.1 Single Prompt Mode

Used for ordinary single-task requests.

Examples:

```text
帮我写一篇公众号推送
```

```text
帮我分析一篇论文
```

```text
帮我设计一份调查问卷
```

Expected output:

* one recommended Prompt
* optional shorter or more detailed variants
* copy button
* optional explanation of assumptions
* optional follow-up Prompt

The recommended Prompt should be the default visible result.

Do not force users to compare multiple versions before they can use the product.

---

### 6.2 Engineering Task Package Mode

Used when the user wants an AI coding tool to build or modify software.

Typical target tools:

* Codex
* Claude Code
* Cursor
* GitHub Copilot
* other coding agents

Expected package may include:

1. Main development Prompt
2. AGENT.md
3. Project architecture requirements
4. Modification boundaries
5. Test requirements
6. Acceptance criteria
7. Fix Prompt
8. Final review Prompt

Example user input:

```text
帮我让 Codex 开发一个微信小程序
```

The system should generate a task package that helps the coding agent:

* understand the project goal
* inspect existing files
* avoid unnecessary rewrites
* follow a clear technical stack
* complete tests
* report changed files
* avoid scope creep

---

### 6.3 Multi-AI Collaboration Package Mode

Used when the user wants multiple AI tools to work together.

Example:

```text
我想让 Codex 和 Claude 同时开发这个项目
```

Expected package may include:

1. Shared project definition
2. Shared AGENT.md
3. Codex Prompt
4. Claude Prompt
5. Work division
6. Deliverable format
7. Integration Prompt
8. Conflict-resolution rules
9. Final acceptance Prompt

The system must avoid assigning identical work to both tools unless deliberate comparison is requested.

Typical division:

```text
Codex:
工程实现、代码修改、测试、构建、运行验证

Claude:
架构设计、规则设计、文档、评审、方案分析
```

The generated package should reduce coordination work for the user.

---

## 7. Target AI Adaptation

The generated Prompt must adapt to the target AI tool.

Supported target categories should initially include:

```text
通用聊天 AI
ChatGPT
Claude
Codex
Claude Code
Gemini
图像生成 AI
```

The target tool affects Prompt structure.

---

### 7.1 General Chat AI

Recommended sections:

* role
* task
* context
* input
* output format
* constraints
* quality requirements

---

### 7.2 Claude

Claude-oriented Prompts may emphasize:

* analysis
* architecture
* trade-offs
* documentation
* structured reasoning
* review criteria
* long-context materials

Do not ask Claude to only give high-level suggestions when the user needs concrete reusable outputs.

---

### 7.3 Codex and Coding Agents

Coding-agent Prompts should include:

* project path or repository context
* requirement summary
* allowed modification scope
* files to inspect
* technical stack
* implementation priority
* tests to run
* build and lint requirements
* acceptance criteria
* forbidden actions
* final report format

Coding Prompts should instruct the agent to inspect the actual repository before modifying files.

They should avoid encouraging:

* complete rewrites without reason
* unnecessary dependencies
* architecture expansion
* branch or worktree creation unless requested
* claiming completion before tests pass

---

### 7.4 Image Generation AI

Image-generation Prompts should include:

* subject
* composition
* scene
* style
* lighting
* color palette
* visual hierarchy
* text content if needed
* aspect ratio
* prohibited elements

Do not use software-development Prompt structures for image-generation tasks.

---

## 8. User Experience Principles

---

### 8.1 Minimum User Effort

The system should infer reasonable defaults whenever possible.

Do not ask the user for information that:

* can be inferred from context
* has little impact on the final Prompt
* can be represented as an editable assumption
* can be handled using a sensible default

Target clarification count:

```text
Simple task: 0–1 question
Complex task: 1–2 questions
Maximum: 3 questions
```

---

### 8.2 Recommended Output First

The interface should default to one recommended result.

Do not make users choose between:

* concise
* expert
* competition
* structured
* advanced

before seeing a usable Prompt.

Alternative versions can remain available under:

```text
其他版本
高级选项
```

---

### 8.3 Technical Details Should Be Secondary

The following information may remain in the system, but should be collapsed by default:

* intent analysis
* task classification
* missing-information list
* Prompt Schema
* Prompt evaluation score
* provider status
* internal assumptions
* rule matching results

Ordinary users should mainly see:

```text
系统理解
必要补充
推荐 Prompt
复制
导出
其他任务包内容
```

---

### 8.4 Copy-and-Use Workflow

The main success path should be:

```text
输入一句话
→ 最多回答少量问题
→ 点击复制
```

The user should not need to:

* manually combine multiple Prompt fragments
* edit JSON
* understand Prompt engineering frameworks
* manually write acceptance criteria
* manually define agent roles
* manually create integration instructions

---

## 9. Prompt Package Structure

A generated task package may use the following structure internally:

```ts
export interface PromptPackage {
  title: string;
  summary: string;
  targetTool: TargetTool;
  taskType: TaskType;
  recommendedPrompt: string;
  additionalPrompts?: PromptArtifact[];
  assumptions: string[];
  clarificationQuestions: ClarificationQuestion[];
  usageInstructions?: string[];
}
```

Supporting types:

```ts
export type TargetTool =
  | "general"
  | "chatgpt"
  | "claude"
  | "codex"
  | "claude_code"
  | "gemini"
  | "image_generation";

export type TaskType =
  | "writing"
  | "research"
  | "academic"
  | "project_planning"
  | "software_development"
  | "code_modification"
  | "multi_ai_collaboration"
  | "presentation"
  | "survey"
  | "data_analysis"
  | "image_generation"
  | "other";

export type PromptArtifactType =
  | "main_prompt"
  | "agent_md"
  | "architecture_prompt"
  | "integration_prompt"
  | "review_prompt"
  | "fix_prompt"
  | "acceptance_prompt"
  | "follow_up_prompt";

export interface PromptArtifact {
  id: string;
  type: PromptArtifactType;
  title: string;
  description: string;
  content: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  field: string;
  required: boolean;
  defaultAnswer?: string;
}
```

These types may be adjusted to match the existing codebase.

Do not rewrite all existing types unless necessary.

---

## 10. Engineering Task Package Requirements

For software-development tasks, the generated package should consider the following sections.

### Main Development Prompt

```text
项目背景
目标
当前状态
技术栈
核心功能
目录要求
实现顺序
修改范围
测试要求
验收标准
禁止事项
完成报告
```

### AGENT.md

The generated AGENT.md should define:

* project goal
* core scope
* architecture boundaries
* coding rules
* development priority
* prohibited features
* testing requirements
* definition of done

### Integration Prompt

Used when one AI needs to integrate another AI's output.

It should define:

* source materials
* target files
* conflict-resolution priority
* compatibility requirements
* test requirements
* final report format

### Fix Prompt

Used after review or testing identifies issues.

It should:

* state confirmed current status
* list concrete defects
* constrain modification scope
* prevent unnecessary feature expansion
* require test, lint, and build validation

### Acceptance Prompt

Used for final verification.

It should include:

* functional tests
* API tests
* build checks
* lint checks
* documentation checks
* security checks where relevant
* honest completion reporting

---

## 11. Multi-AI Collaboration Rules

When generating a package for multiple AI tools:

1. Define one shared project goal.
2. Define one shared project scope.
3. Generate one shared AGENT.md.
4. Assign different responsibilities to each AI.
5. Define the expected deliverable from each AI.
6. Define the order of integration.
7. Define how conflicts are resolved.
8. Define which tool owns final code integration.
9. Define final acceptance checks.
10. Prevent both agents from independently changing the same files without coordination.

Recommended conflict priority:

```text
AGENT.md
→ explicit user requirements
→ current working code
→ agreed architecture
→ individual agent suggestions
```

Recommended default ownership:

```text
Codex:
final repository integration and validation

Claude:
architecture, rules, documentation, review materials
```

This is a default, not a mandatory rule.

Adapt according to the actual tools named by the user.

---

## 12. Prompt Generation Quality Rules

Every recommended Prompt should be:

* directly copyable
* complete enough to execute
* specific to the user's goal
* adapted to the target AI
* clear about deliverables
* clear about boundaries
* clear about success criteria
* free of irrelevant Prompt jargon
* concise enough to remain usable
* detailed enough to reduce repeated communication

Do not optimize for maximum Prompt length.

A longer Prompt is not automatically better.

The generated Prompt should contain only information that helps the target AI complete the task.

---

## 13. Clarification Logic

Ask a question only when the answer materially affects:

* target platform
* output type
* technical stack
* audience
* scale
* deadline
* format
* collaboration structure
* acceptance criteria

Bad clarification:

```text
你还有什么其他要求吗？
```

Good clarification:

```text
你希望 Codex 开发网页、微信小程序还是移动端应用？
```

Bad clarification:

```text
你想要什么风格？
```

Better clarification:

```text
这篇招新文案主要发布在微信公众号还是微信群？
```

Whenever possible, provide a default:

```text
未指定时，将按 Next.js 网页项目生成。
```

The user should be able to select:

```text
按默认设置生成
```

---

## 14. Existing Infrastructure

The current project may already include:

* rule-based intent classification
* Prompt templates
* DeepSeek optional enhancement
* API validation
* rate limiting
* anonymous identifiers
* request IDs
* logging
* health endpoint
* feedback endpoint
* events endpoint
* Redis-related code
* testing infrastructure
* privacy documentation

Do not delete stable infrastructure merely because product priorities have changed.

However:

* do not continue expanding infrastructure unless necessary
* do not make Redis, health checks, analytics, or provider status the main user experience
* do not prioritize infrastructure work over user-facing Prompt package quality
* keep technical systems in maintenance mode unless they block the core flow

---

## 15. Product Development Priorities

Follow this order.

### P0: Product Direction Correction

1. Make one recommended Prompt the primary output.
2. Add target AI selection or automatic target detection.
3. Add engineering task package generation.
4. Add multi-AI collaboration package generation.
5. Add AGENT.md generation.
6. Add integration, fix, and acceptance Prompt generation.
7. Reduce clarification questions.
8. Collapse technical details by default.

### P1: Usability

1. Copy individual artifact.
2. Copy complete package.
3. Export Markdown.
4. Save package locally.
5. Reuse previous input.
6. Edit assumptions before regenerating.
7. Add clear usage instructions.

### P2: Quality

1. Improve target-specific templates.
2. Improve Codex task instructions.
3. Improve Claude architecture instructions.
4. Improve multi-AI division.
5. Add realistic test examples.
6. Compare generated package with manual Prompt writing.
7. Collect user feedback on editing effort.

### P3: Infrastructure Maintenance

1. Preserve existing tests.
2. Keep lint and build passing.
3. Fix confirmed security issues.
4. Maintain reasonable rate limits.
5. Maintain privacy boundaries.

Do not let P3 replace P0–P2.

---

## 16. MVP 2.0 Scope

The next user-facing version should support:

1. Natural-language intention input
2. Target AI selection or detection
3. Maximum three clarification questions
4. Default assumptions
5. One recommended Prompt
6. Engineering task package
7. Multi-AI collaboration package
8. AGENT.md generation
9. Integration Prompt
10. Fix Prompt
11. Acceptance Prompt
12. Copy single artifact
13. Copy all
14. Export Markdown
15. Technical details collapsed by default

---

## 17. Features Not Required Now

Do not prioritize:

* direct task execution
* general chatbot conversations
* model-generated final business documents
* user accounts
* subscription billing
* payment
* team workspace
* Prompt marketplace
* cloud Prompt history
* full analytics dashboard
* RAG
* vector database
* autonomous agents
* plugin platform
* mobile application
* browser extension
* complex database architecture
* production multi-region deployment

These may be considered only after product value is validated.

---

## 18. User-Facing Terminology

Prefer:

```text
你的目标
目标 AI
推荐任务指令
项目任务包
协作任务包
开发说明
整合说明
验收说明
补充信息
默认假设
```

Avoid emphasizing:

```text
Prompt Schema
Prompt Compiler
Few-shot
Chain of Thought
System Prompt
Token
Temperature
Provider Status
Rule Engine
```

The word “Prompt” may still be used because it is commonly understood, but the interface should focus on practical usage.

---

## 19. Key Product Metrics

The primary metric is not Prompt length.

Track:

### User preparation time

How long it takes from intention input to copying the final package.

Target:

```text
Simple task: under 30 seconds
Engineering package: under 2 minutes
```

### Clarification count

Target:

```text
Simple task: 0–1
Complex task: 1–3
```

### Editing effort

Measure how much the user must modify before using the result.

Target:

```text
Most users should only need to replace project-specific details.
```

### Package usage

Measure:

* recommended Prompt copied
* AGENT.md copied
* integration Prompt copied
* acceptance Prompt copied
* whole package exported

### User usefulness

Ask:

```text
这份任务包是否减少了你整理需求和编写 Prompt 的时间？
```

This is more important than asking whether the Prompt “looks professional.”

---

## 20. Demo Scenarios

The product must be tested with at least these scenarios.

### Scenario 1

```text
我想让 Codex 开发一个社团报名系统。
```

Expected output:

* recommended Codex Prompt
* AGENT.md
* test and acceptance requirements
* optional fix Prompt

### Scenario 2

```text
我想让 Codex 和 Claude 一起开发一个 Prompt 生成器。
```

Expected output:

* shared project definition
* Codex Prompt
* Claude Prompt
* shared AGENT.md
* integration Prompt
* acceptance Prompt

### Scenario 3

```text
帮我让 Claude 评审一个已有项目。
```

Expected output:

* repository review Prompt
* architecture review checklist
* defect-report format
* follow-up fix Prompt

### Scenario 4

```text
帮我生成一篇微信公众号招新推送的 Prompt。
```

Expected output:

* recommended writing Prompt
* default audience and platform assumptions
* optional revision Prompt

### Scenario 5

```text
帮我生成一张高校科技社团招新海报的图片 Prompt。
```

Expected output:

* image-generation Prompt
* composition
* style
* aspect ratio
* text hierarchy
* negative constraints

---

## 21. Definition of Done

A product change is complete only when:

1. It reduces user preparation work.
2. It supports the core Prompt or task-package workflow.
3. It does not turn the product into a general chatbot.
4. It does not add unnecessary user choices.
5. It keeps technical details secondary.
6. It produces directly reusable output.
7. Existing core workflows still function.
8. Tests pass.
9. Lint passes.
10. Build passes.
11. Documentation reflects actual behavior.
12. The final report honestly states unresolved issues.

Required commands:

```bash
npm test
npm run lint
npm run build
```

Do not claim completion before these checks pass.

---

## 22. Change Control Rules

Before modifying the project:

1. Read this `AGENT.md`.
2. Inspect the actual repository.
3. Review existing types and components.
4. Preserve working features.
5. Identify the smallest useful change.
6. Avoid rewriting the whole architecture.
7. Avoid introducing new dependencies without a clear reason.
8. Avoid changing infrastructure unrelated to the user-facing goal.
9. Update tests for changed behavior.
10. Update README for major product changes.

When requirements conflict, use this priority:

```text
Explicit current user request
→ AGENT.md
→ current working behavior
→ existing documentation
→ implementation convenience
```

---

## 23. Final Product Principle

The system should not attempt to do every task for the user.

It should help the user prepare better instructions for the AI tools they already use.

The final product experience should be:

> 用户说清楚大概想做什么，系统负责整理需求、补全结构、分配 AI 工作并生成可直接使用的任务包。
