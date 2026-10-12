import { afterEach, describe, expect, it, vi } from "vitest";
import { generatePromptPackage } from "@/lib/intentAnalyzer";
import { adoptVersion, appendVersion, compareLines, createWorkspace, currentPackage, MAX_VERSIONS, workspaceMarkdown } from "@/lib/workbench";
import { clearHistoryStorage, historyKey, loadHistory, MAX_STORAGE_CHARS, parseWorkspaceHistory, removeHistoryItem, saveHistoryItems, saveWorkspace, workspaceHistoryKey } from "@/lib/history";
import { buildProtectedContext, checkProtectedContent, suspiciousAdditions } from "@/lib/optimizationGuard";
import { inspectStructure } from "@/lib/promptEvaluator";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
async function workspace() {
  vi.stubEnv("LLM_PROVIDER", "mock");
  return createWorkspace({ ...await generatePromptPackage("用 Codex 修复登录，禁止新增依赖；数据库版本待补充"), requestId: "mock-request" });
}
afterEach(() => vi.unstubAllEnvs());

describe("task versions", () => {
  it("retains originals, branches from selected parent, and adopts only explicitly", async () => {
    const root = await workspace(), artifact = "main-prompt";
    const first = appendVersion(root, artifact, root.versions[0].content + "\n输出回归测试结果。", { kind: "manual" });
    expect(first.versions[0]).toEqual(root.versions[0]); expect(currentPackage(first)).toEqual(root.result.package);
    const branched = appendVersion({ ...first, selected: root.selected }, artifact, "另一分支", { kind: "manual" });
    expect(branched.versions.at(-1)?.parentId).toBe(root.versions[0].id);
    const adopted = adoptVersion(branched, artifact, branched.versions.at(-1)!.id);
    expect(currentPackage(adopted).artifacts[0].content).toBe("另一分支");
    expect(() => adoptVersion(root, artifact, root.versions[1].id)).toThrow();
    expect(workspaceMarkdown(adopted)).toContain("父版本");
  });
  it("limits versions without discarding parent history", async () => {
    let current = await workspace();
    while (current.versions.length < MAX_VERSIONS) current = appendVersion(current, "main-prompt", "保留版本", { kind: "manual" });
    expect(() => appendVersion(current, "main-prompt", "超限", { kind: "manual" })).toThrow("40");
    expect(() => appendVersion(current, "main-prompt", " ", { kind: "manual" })).toThrow();
  });
  it("reports textual changes without claiming a winner", () => {
    expect(compareLines("A\nA\nB", "A\nB\nC")).toEqual({ added: ["C"], removed: ["A"], unchanged: false });
  });
});

describe("local storage", () => {
  it("migrates input-only history without inventing prompt versions", () => {
    const storage = memoryStorage(), legacy = [{ input: "旧任务", createdAt: "2026-01-01" }];
    storage.setItem(historyKey, JSON.stringify(legacy));
    expect(loadHistory(storage).items).toEqual(legacy); expect(storage.getItem(historyKey)).not.toBeNull(); expect(loadHistory(storage).items[0].workspace).toBeUndefined();
  });
  it("restores parent links, adoption, provenance and editing drafts", async () => {
    const storage = memoryStorage(), root = await workspace();
    const next = appendVersion(root, "main-prompt", root.versions[0].content + "\n额外交付", { kind: "model", provider: "deepseek", model: "actual-model" }, "补充交付");
    const saved = { ...adoptVersion(next, "main-prompt", next.versions.at(-1)!.id), drafts: { "main-prompt": "未保留编辑" }, feedback: { "main-prompt": "更简洁" } };
    expect(saveWorkspace(storage, saved)).toBeUndefined(); expect(loadHistory(storage).items[0].workspace).toEqual(saved);
    expect(removeHistoryItem(storage, loadHistory(storage).items[0])).toBeUndefined(); expect(loadHistory(storage).items).toEqual([]);
  });
  it("skips corrupt nested data and invalid parent links without overwriting raw bytes", async () => {
    const storage = memoryStorage(), root = await workspace();
    for (const corrupted of [
      { ...root, result: { ...root.result, package: { artifacts: [] } } },
      { ...root, versions: root.versions.map((v) => ({ ...v, parentId: "missing" })) },
      { ...root, adopted: { "main-prompt": "missing" } },
      { ...root, result: { ...root.result, providerMessage: { corrupt: true } } },
    ]) {
      const raw = JSON.stringify({ schemaVersion: 2, items: [{ input: "test", createdAt: "now", workspace: corrupted }] });
      storage.setItem(workspaceHistoryKey, raw);
      expect(loadHistory(storage).warning).toContain("损坏"); expect(saveWorkspace(storage, root)).toContain("损坏"); expect(storage.getItem(workspaceHistoryKey)).toBe(raw);
    }
    expect(parseWorkspaceHistory("{").warning).toBeTruthy(); expect(parseWorkspaceHistory('{"schemaVersion":999,"items":[]}').warning).toBeTruthy();
    const legacy = memoryStorage(); legacy.setItem(historyKey, "{broken");
    expect(loadHistory(legacy).warning).toContain("损坏"); expect(legacy.getItem(workspaceHistoryKey)).toBeNull();
  });
  it("reports quota and unavailable storage", async () => {
    const root = await workspace();
    const denied = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); }, removeItem: () => { throw new Error(); } };
    expect(loadHistory(denied).warning).toContain("不可用"); expect(saveWorkspace(denied, root)).toContain("不可用"); expect(clearHistoryStorage(denied)).toContain("无法");
    const quota = { ...memoryStorage(), setItem: () => { throw new Error("quota"); } };
    expect(saveWorkspace(quota, root)).toContain("保存失败");
    expect(saveHistoryItems(memoryStorage(), [{ input: "x".repeat(MAX_STORAGE_CHARS), createdAt: "now" }])).toContain("容量");
  });
  it("keeps 6 tasks and updates the same workspace", async () => {
    const storage = memoryStorage(), root = await workspace();
    for (let i = 0; i < 8; i++) expect(saveWorkspace(storage, { ...root, id: `task-${i}` })).toBeUndefined();
    expect(loadHistory(storage).items).toHaveLength(6); expect(loadHistory(storage).items.at(-1)?.id).toBe("task-2");
    expect(saveWorkspace(storage, { ...root, id: "task-7" })).toBeUndefined(); expect(loadHistory(storage).items).toHaveLength(6);
  });
});

describe("protection and structure inspection", () => {
  it("protects goal, tools, constraints, facts and unknowns", () => {
    const original = "你是 Codex。\n目标：修复登录\n当前上下文：\n- 已知：沿用现有系统\n- 数据库：【待补充】\n\n禁止新增依赖。";
    const context = buildProtectedContext("修复登录", ["codex"], original, original);
    expect(checkProtectedContent(original, context)).toEqual([]);
    for (const removed of ["你是 Codex。", "目标：修复登录", "- 已知：沿用现有系统", "- 数据库：【待补充】", "禁止新增依赖。"]) expect(checkProtectedContent(original.replace(removed, ""), context)).toContain(removed);
  });
  it("flags invented tech, money, dates and completion", () => {
    expect(suspiciousAdditions("修复登录", "修复登录；使用 React；预算：1000 元；截止日期：2026-10-20；已完成登录")).toHaveLength(4);
    expect(suspiciousAdditions("使用 React", "使用 React；预算：待补充")).toEqual([]);
  });
  it("lists concrete missing structure instead of length-based effect claims", () => {
    expect(inspectStructure("帮我写点东西").issues).toEqual(expect.arrayContaining(["缺少背景或已知事实。", "缺少输出格式或交付物说明。", "缺少明确约束。", "缺少可核查的验收标准。"]));
    expect(inspectStructure("背景：待补充；目标：写说明；输出 Markdown；不要编造；验收：核对来源").issues).toContain("仍有未确认信息，请补充或核对默认假设。");
  });
});
