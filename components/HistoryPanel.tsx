"use client";

import type { HistoryItem } from "@/lib/history";

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (item: HistoryItem) => void;
}

export function HistoryPanel({ history, onSelect, onClear, onDelete }: HistoryPanelProps) {
  return (
    <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">历史记录</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!history.length}
          className="text-sm text-slate-500 transition hover:text-accent disabled:cursor-not-allowed disabled:text-slate-300"
        >
          清空
        </button>
      </div>
      {history.length ? (
        <div className="mt-4 space-y-2">
          {history.map((item) => (
            <div key={item.id ?? `${item.createdAt}-${item.input}`}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-md border border-line p-3 text-left transition hover:border-accent hover:bg-blue-50"
            >
              <span className="block text-sm font-medium text-ink">{item.input}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.createdAt}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.workspace ? "恢复已保存工作台" : "旧记录：仅恢复输入"}</span>
            </button>
            <button type="button" onClick={() => onDelete(item)} className="mt-1 text-xs text-slate-500">删除此记录</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">生成后保存最近 6 个任务。编辑和采用后请点击保存工作台。</p>
      )}
    </aside>
  );
}
