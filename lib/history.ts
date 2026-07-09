export interface HistoryItem {
  input: string;
  createdAt: string;
}

export const historyKey = "intent2prompt-history-v1";
export const historyEvent = "intent2prompt-history-change";

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
