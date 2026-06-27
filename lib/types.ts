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

export interface IntentRule {
  taskType: TaskType;
  label: string;
  keywords: string[];
  defaultGoal: string;
  defaultOutput: string;
  defaultScenario: string;
  priority: number;
}

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

export interface PromptTemplate {
  id: string;
  name: string;
  taskType: TaskType;
  keywords: string[];
  requiredInfo: string[];
  recommendedRole: string;
  targetOutput: string;
  scenario: string;
  commonConstraints: string[];
  outputFormat: string[];
  qualityCriteria: string[];
  examples?: string[];
}

export const EVAL_WEIGHTS = {
  taskClarity: 20,
  contextCompleteness: 15,
  outputFormatClarity: 15,
  constraintQuality: 15,
  executability: 15,
  hallucinationRiskControl: 10,
  chineseExpressionQuality: 10,
} as const;
