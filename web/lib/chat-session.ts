const STORAGE_KEY = "Aurex Logistics_support_chat";

export interface StoredChatSession {
  chatId: string;
  clientName: string;
  clientEmail: string;
  subject?: string;
  trackingId?: string | null;
}

export function loadChatSession(): StoredChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatSession;
    if (!parsed?.chatId || !parsed?.clientEmail) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveChatSession(session: StoredChatSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearChatSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
