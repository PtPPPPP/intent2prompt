"use client";

interface HistoryItem {
  input: string;
  createdAt: string;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (input: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
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
            <button
              type="button"
              key={`${item.createdAt}-${item.input}`}
              onClick={() => onSelect(item.input)}
              className="w-full rounded-md border border-line p-3 text-left transition hover:border-accent hover:bg-blue-50"
            >
              <span className="block text-sm font-medium text-ink">{item.input}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.createdAt}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">生成后会自动保存最近 6 条。</p>
      )}
    </aside>
  );
}
