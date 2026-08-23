import type { Lang } from "@ai-tutor/common";

export type Theme = "light" | "dark" | "system";

export interface StoredMsg {
  role: "user" | "assistant";
  content: string;
  blocked?: { reason: string; layer: number };
  demo?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  subject?: string;
  grade?: number;
  messages: StoredMsg[];
  updatedAt: number;
}

export interface Profile {
  name: string;
  grade?: number;
  lang: Lang;
  theme: Theme;
}

export const DEFAULT_PROFILE: Profile = { name: "", lang: "uz", theme: "system" };

const pKey = (uid: string) => `ai-tutor:profile:${uid}`;
const cKey = (uid: string) => `ai-tutor:convos:${uid}`;

export function loadProfile(uid: string): Profile {
  try {
    const r = localStorage.getItem(pKey(uid));
    return r ? { ...DEFAULT_PROFILE, ...JSON.parse(r) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}
export function saveProfile(uid: string, p: Profile): void {
  try {
    localStorage.setItem(pKey(uid), JSON.stringify(p));
  } catch {
    /* quota / private mode */
  }
}

export function loadConversations(uid: string): Conversation[] {
  try {
    const r = localStorage.getItem(cKey(uid));
    return r ? (JSON.parse(r) as Conversation[]) : [];
  } catch {
    return [];
  }
}
export function saveConversations(uid: string, list: Conversation[]): void {
  try {
    localStorage.setItem(cKey(uid), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Заголовок беседы из первого вопроса ученика. */
export function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "Yangi suhbat";
}
