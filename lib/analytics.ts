import type { PromptMode, TaskType } from "./types";

export type AnalyticsEventType = "generation_completed" | "generation_failed" | "feedback_submitted";

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  requestId: string;
  providerStatus?: string;
  taskType?: TaskType;
  promptMode?: PromptMode;
  durationMs?: number;
}

export interface AnalyticsStore {
  record(event: AnalyticsEvent): Promise<void>;
}

class ConsoleAnalyticsStore implements AnalyticsStore {
  async record(event: AnalyticsEvent): Promise<void> {
    console.info(JSON.stringify({ type: "analytics", ...event, timestamp: new Date().toISOString() }));
  }
}

const analyticsStore = new ConsoleAnalyticsStore();

export function recordAnalytics(event: AnalyticsEvent): Promise<void> {
  return analyticsStore.record(event);
}
