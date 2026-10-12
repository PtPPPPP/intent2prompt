import type { Workspace } from "./workbench";
import { MAX_FEEDBACK_LENGTH, MAX_PROMPT_LENGTH, MAX_VERSIONS } from "./workbench";

export interface HistoryItem {
  input: string;
  createdAt: string;
  id?: string;
  workspace?: Workspace;
}

export const historyKey = "intent2prompt-history-v1";
export const historyEvent = "intent2prompt-history-change";
export const workspaceHistoryKey = "intent2prompt-history-v2";
export const MAX_HISTORY = 6;
export const MAX_STORAGE_CHARS = 2_000_000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = MAX_PROMPT_LENGTH): value is string => typeof value === "string" && value.length <= max;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => text(v));

function validWorkspace(value: unknown): value is Workspace {
  if (!record(value) || !text(value.id, 100) || !record(value.result) || !Array.isArray(value.versions) || value.versions.length > MAX_VERSIONS || !value.versions.length) return false;
  const result = value.result;
  if (!["mock", "deepseek", "fallback"].includes(String(result.providerStatus)) || (result.providerMessage !== undefined && !text(result.providerMessage)) || !strings(result.clarifyingQuestions)) return false;
  const pack = result.package;
  if (!text(result.requestId, 100) || !text(result.originalInput, 1000) || !record(pack) || !text(pack.id, 100) || !text(pack.title) || !text(pack.summary) || !text(pack.mode) || !text(pack.recommendedArtifactId, 100) || !strings(pack.targetTools) || !strings(pack.assumptions) || !strings(pack.usageInstructions) || !Array.isArray(pack.clarificationQuestions) || !Array.isArray(pack.artifacts) || !pack.artifacts.length || pack.artifacts.length > 20) return false;
  if (!pack.artifacts.every((a) => record(a) && text(a.id, 100) && text(a.title) && text(a.type) && text(a.description) && text(a.content))) return false;
  if (!pack.artifacts.some((a) => a.id === pack.recommendedArtifactId)) return false;
  if (!pack.clarificationQuestions.every((q) => record(q) && text(q.id) && text(q.question) && text(q.field))) return false;
  const analysis = result.analysis, schema = result.promptSchema, evaluation = result.evaluation;
  if (!record(analysis) || !text(analysis.taskType) || !text(analysis.userGoal) || !text(analysis.targetOutput) || !text(analysis.scenario) || !strings(analysis.knownInfo) || !strings(analysis.missingInfo) || !strings(analysis.assumptions)) return false;
  if (!record(schema) || ![schema.role, schema.task, schema.context, schema.input].every((v) => text(v)) || ![schema.constraints, schema.outputFormat, schema.qualityCriteria].every(strings)) return false;
  if (!record(evaluation) || typeof evaluation.score !== "number" || !record(evaluation.dimensionScores) || !Object.values(evaluation.dimensionScores).every((v) => typeof v === "number") || !strings(evaluation.suggestions) || !strings(evaluation.strengths) || !strings(evaluation.weaknesses)) return false;
  if (!Array.isArray(result.promptVersions) || !result.promptVersions.every((v) => record(v) && text(v.mode) && text(v.title) && text(v.description) && text(v.content))) return false;
  const ids = new Set<string>();
  const artifactIds = new Set(pack.artifacts.map((a) => a.id));
  const versionArtifacts = new Map<string, string>();
  for (const v of value.versions) {
    if (!record(v) || !text(v.id, 100) || ids.has(v.id) || !text(v.artifactId, 100) || !artifactIds.has(v.artifactId) || !text(v.content) || !v.content.trim() || !text(v.createdAt, 100) || !Number.isFinite(Date.parse(v.createdAt)) || !text(v.feedback, MAX_FEEDBACK_LENGTH) || !strings(v.warnings) || !record(v.source) || !["rules", "manual", "model", "unknown"].includes(String(v.source.kind))) return false;
    if (v.parentId !== null && (!text(v.parentId, 100) || versionArtifacts.get(v.parentId) !== v.artifactId)) return false;
    if (![v.source.model, v.source.provider, v.source.requestedModel].every((field) => field === undefined || text(field, 300))) return false;
    ids.add(v.id); versionArtifacts.set(v.id, v.artifactId);
  }
  for (const mapping of [value.adopted, value.selected]) {
    if (!record(mapping) || pack.artifacts.some((a) => versionArtifacts.get(String(mapping[a.id])) !== a.id)) return false;
  }
  for (const [mapping, max] of [[value.drafts, MAX_PROMPT_LENGTH], [value.feedback, MAX_FEEDBACK_LENGTH]] as const) {
    if (!record(mapping) || !Object.entries(mapping).every(([key, v]) => artifactIds.has(key) && text(v, max))) return false;
  }
  return true;
}

export function parseWorkspaceHistory(raw: string | null): { items: HistoryItem[]; warning?: string } {
  if (!raw) return { items: [] };
  try {
    if (raw.length > MAX_STORAGE_CHARS) throw new Error();
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.schemaVersion !== 2 || !Array.isArray(parsed.items)) throw new Error();
    const items = parsed.items.filter((item) => isHistoryItem(item) && item.input.length <= 1000 && item.createdAt.length <= 100 && (item.id === undefined || text(item.id, 100)) && (!item.workspace || validWorkspace(item.workspace))) as HistoryItem[];
    return { items: items.slice(0, MAX_HISTORY), ...(items.length !== parsed.items.length ? { warning: "已跳过损坏的本地记录；原始存储未被覆盖。" } : {}) };
  } catch { return { items: [], warning: "本地记录损坏或格式不支持；原始存储未被覆盖，可导出当前任务后清空记录。" }; }
}

export function loadHistory(storage: StorageLike): { items: HistoryItem[]; warning?: string } {
  try {
    const raw = storage.getItem(workspaceHistoryKey);
    if (raw !== null) return parseWorkspaceHistory(raw);
    // v1 只有输入，迁移后仍作为可重新生成的输入记录，不虚构旧版本。
    const legacyRaw = storage.getItem(historyKey);
    const legacy = parseHistory(legacyRaw).slice(0, MAX_HISTORY);
    if (legacyRaw) {
      try {
        const data: unknown = JSON.parse(legacyRaw);
        if (!Array.isArray(data) || data.some((item) => !isHistoryItem(item))) return { items: legacy, warning: "旧版本地记录有损坏项；未覆盖原始数据，请先导出当前任务再清理。" };
      } catch { return { items: [], warning: "旧版本地记录损坏；未覆盖原始数据，请清理后再保存。" }; }
    }
    if (legacy.length) {
      try { storage.setItem(workspaceHistoryKey, JSON.stringify({ schemaVersion: 2, items: legacy })); }
      catch { return { items: legacy, warning: "旧输入可读取，但存储不可用，迁移尚未保存。" }; }
    }
    return { items: legacy };
  } catch { return { items: [], warning: "浏览器本地存储不可用；可继续编辑并导出，但刷新后不会恢复。" }; }
}

export function saveHistoryItems(storage: StorageLike, items: HistoryItem[]): string | undefined {
  const raw = JSON.stringify({ schemaVersion: 2, items: items.slice(0, MAX_HISTORY) });
  if (raw.length > MAX_STORAGE_CHARS) return "本地记录容量超过上限，请导出后删除不需要的任务再保存。";
  try { storage.setItem(workspaceHistoryKey, raw); return undefined; }
  catch { return "本地保存失败：存储不可用或容量不足。当前编辑仍保留，请导出备份。"; }
}

export function saveWorkspace(storage: StorageLike, workspace: Workspace): string | undefined {
  const current = loadHistory(storage);
  if (current.warning) return current.warning + " 请先导出并清理记录，避免覆盖损坏数据。";
  const item: HistoryItem = { id: workspace.id, input: workspace.result.originalInput, createdAt: new Date().toISOString(), workspace };
  return saveHistoryItems(storage, [item, ...current.items.filter((i) => i.id !== workspace.id)].slice(0, MAX_HISTORY));
}

export function removeHistoryItem(storage: StorageLike, item: HistoryItem): string | undefined {
  const loaded = loadHistory(storage);
  if (loaded.warning) return loaded.warning;
  return saveHistoryItems(storage, loaded.items.filter((i) => item.id ? i.id !== item.id : i.input !== item.input || i.createdAt !== item.createdAt));
}

export function clearHistoryStorage(storage: StorageLike): string | undefined {
  try { storage.removeItem(workspaceHistoryKey); storage.removeItem(historyKey); }
  catch { return "无法清空本地存储，请在浏览器设置中删除站点数据。"; }
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Partial<Record<keyof HistoryItem, unknown>>;
  return (
    typeof item.input === "string" &&
    item.input.trim().length > 0 &&
    typeof item.createdAt === "string"
  );
}

export function parseHistory(raw: string | null): HistoryItem[] {
  if (raw === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryItem).map((item) => ({
      input: item.input.trim(),
      createdAt: item.createdAt,
    }));
  } catch {
    return [];
  }
}
