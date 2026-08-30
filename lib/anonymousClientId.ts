const anonymousClientKey = "intent2prompt-anonymous-client-id";

export function getAnonymousClientId(): string {
  try {
    const existing = window.localStorage.getItem(anonymousClientKey);
    if (existing) return existing;
  } catch { return crypto.randomUUID(); }
  const id = crypto.randomUUID();
  try { window.localStorage.setItem(anonymousClientKey, id); } catch { return id; }
  return id;
}
