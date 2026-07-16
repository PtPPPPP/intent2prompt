export interface RequestLogEntry {
  requestId: string;
  route: string;
  status: number;
  durationMs: number;
  providerStatus?: string;
  inputLength?: number;
  taskType?: string;
  errorCode?: string;
}

export function logRequest(entry: RequestLogEntry): void {
  console.info(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
}
