import type { GeneratePromptResult, PromptPackage } from "./types";

export const MAX_PROMPT_LENGTH = 20000;
export const MAX_VERSIONS = 40;
export const MAX_FEEDBACK_LENGTH = 1000;

export interface ModelSource {
  kind: "rules" | "manual" | "model" | "unknown";
  provider?: string;
  model?: string;
  requestedModel?: string;
}

export interface TaskVersion {
  id: string;
  artifactId: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  feedback: string;
  source: ModelSource;
  warnings: string[];
}

export interface Workspace {
  id: string;
  result: GeneratePromptResult & { requestId: string };
  versions: TaskVersion[];
  adopted: Record<string, string>;
  selected: Record<string, string>;
  drafts: Record<string, string>;
  feedback: Record<string, string>;
}

export function createWorkspace(result: Workspace["result"]): Workspace {
  const versions: TaskVersion[] = result.package.artifacts.map((artifact) => ({
    id: crypto.randomUUID(), artifactId: artifact.id, content: artifact.content,
    createdAt: new Date().toISOString(), parentId: null, feedback: "",
    source: artifact.id === result.package.recommendedArtifactId && result.providerStatus === "deepseek"
      ? result.modelSource ?? { kind: "unknown", provider: "deepseek" }
      : { kind: "rules" }, warnings: [],
  }));
  const adopted = Object.fromEntries(versions.map((v) => [v.artifactId, v.id]));
  return { id: crypto.randomUUID(), result, versions, adopted, selected: { ...adopted }, drafts: {}, feedback: {} };
}

export function appendVersion(workspace: Workspace, artifactId: string, content: string, source: ModelSource, feedback = "", warnings: string[] = []): Workspace {
  if (!content.trim() || content.length > MAX_PROMPT_LENGTH) throw new Error("指令必须为 1–20000 个字符。");
  if (workspace.versions.length >= MAX_VERSIONS) throw new Error("本任务已达 40 个版本，请导出并创建新任务。");
  const parent = workspace.versions.find((v) => v.id === workspace.selected[artifactId] && v.artifactId === artifactId);
  if (!parent) throw new Error("找不到父版本。");
  const version: TaskVersion = { id: crypto.randomUUID(), artifactId, content, source, feedback, warnings, parentId: parent.id, createdAt: new Date().toISOString() };
  const drafts = { ...workspace.drafts };
  delete drafts[artifactId];
  return { ...workspace, drafts, versions: [...workspace.versions, version], selected: { ...workspace.selected, [artifactId]: version.id } };
}

export function adoptVersion(workspace: Workspace, artifactId: string, versionId: string): Workspace {
  if (!workspace.versions.some((v) => v.id === versionId && v.artifactId === artifactId)) throw new Error("版本不属于当前指令。");
  return { ...workspace, adopted: { ...workspace.adopted, [artifactId]: versionId } };
}

export function currentPackage(workspace: Workspace): PromptPackage {
  return { ...workspace.result.package, artifacts: workspace.result.package.artifacts.map((artifact) => ({
    ...artifact, content: workspace.versions.find((v) => v.id === workspace.adopted[artifact.id])?.content ?? artifact.content,
  })) };
}

export function sourceLabel(source: ModelSource): string {
  if (source.kind === "rules") return "规则 / 模板（未调用模型）";
  if (source.kind === "manual") return "用户编辑（未调用模型）";
  if (source.kind === "unknown") return "旧记录：实际模型未知";
  return `${source.provider} · ${source.model ?? `请求 ${source.requestedModel ?? "未知"}；响应未报告模型`}`;
}

// 文本差异只描述增删，不判断质量；集合计数保留重复行。
export function compareLines(before: string, after: string) {
  const subtract = (left: string[], right: string[]) => {
    const remaining = [...right];
    return left.filter((line) => { const index = remaining.indexOf(line); if (index < 0) return true; remaining.splice(index, 1); return false; });
  };
  const a = before.split("\n").filter((line) => line.trim());
  const b = after.split("\n").filter((line) => line.trim());
  return { removed: subtract(a, b), added: subtract(b, a), unchanged: before === after };
}

export function workspaceMarkdown(workspace: Workspace): string {
  const pack = currentPackage(workspace);
  return [`# ${pack.title}`, "", pack.summary, "", ...pack.artifacts.flatMap((a) => [
    `## ${a.title}`, "", a.content, "",
  ]), "# 版本记录（结构检查不代表实际效果）", "", ...workspace.versions.flatMap((v, index) => [
    `## V${index + 1} · ${pack.artifacts.find((a) => a.id === v.artifactId)?.title}`,
    `- ID：${v.id}`, `- 时间：${v.createdAt}`, `- 父版本：${v.parentId ?? "原稿"}`,
    `- 来源：${sourceLabel(v.source)}`, `- 反馈：${v.feedback || "无"}`,
    `- 已采用：${workspace.adopted[v.artifactId] === v.id ? "是" : "否"}`,
    ...v.warnings.map((warning) => `- 待核查：${warning}`), "", v.content, "",
  ])].join("\n");
}
