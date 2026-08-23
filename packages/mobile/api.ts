/** API-клиент к серверу AI Tutor + персистентная сессия (AsyncStorage). */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

export type Lang = "uz" | "ru" | "en";
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorReply {
  reply: string;
  demo: boolean;
  blocked?: { reason: string; layer: 1 | 2 | 3 };
}

export const SUBJECTS = [
  { id: "math", emoji: "➗", label: { uz: "Matematika", ru: "Математика", en: "Mathematics" } },
  { id: "algebra", emoji: "🧮", label: { uz: "Algebra", ru: "Алгебра", en: "Algebra" } },
  { id: "geometry", emoji: "📐", label: { uz: "Geometriya", ru: "Геометрия", en: "Geometry" } },
  { id: "physics", emoji: "🔭", label: { uz: "Fizika", ru: "Физика", en: "Physics" } },
  { id: "chemistry", emoji: "⚗️", label: { uz: "Kimyo", ru: "Химия", en: "Chemistry" } },
  { id: "biology", emoji: "🧬", label: { uz: "Biologiya", ru: "Биология", en: "Biology" } },
  { id: "history", emoji: "🏛️", label: { uz: "Tarix", ru: "История", en: "History" } },
  { id: "english", emoji: "🔤", label: { uz: "Ingliz tili", ru: "Английский", en: "English" } },
  { id: "informatics", emoji: "💻", label: { uz: "Informatika", ru: "Информатика", en: "CS" } },
] as const;

/* ---------------- Сессия ---------------- */

export interface SessionInfo {
  userId: number | null;
  token: string | null;
}

const KEYS = { deviceId: "ai-tutor.deviceId", userId: "ai-tutor.userId", token: "ai-tutor.token" };

/** Стабильная сессия: deviceId хранится в AsyncStorage — история переживает рестарты. */
export async function ensureSession(lang: Lang): Promise<SessionInfo> {
  let deviceId = await AsyncStorage.getItem(KEYS.deviceId);
  if (!deviceId) {
    deviceId = `expo-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await AsyncStorage.setItem(KEYS.deviceId, deviceId);
  }
  try {
    const res = await fetch(`${API_URL}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId, lang }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as SessionInfo & { persisted: boolean };
      if (data.userId != null && data.token) {
        await AsyncStorage.setItem(KEYS.userId, String(data.userId));
        await AsyncStorage.setItem(KEYS.token, data.token);
        return { userId: data.userId, token: data.token };
      }
    }
  } catch {
    /* сервер недоступен — пробуем сохранённую сессию */
  }
  // офлайн-фолбэк: сохранённые userId+token
  const uid = await AsyncStorage.getItem(KEYS.userId);
  const tok = await AsyncStorage.getItem(KEYS.token);
  return { userId: uid ? Number(uid) : null, token: tok ?? null };
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const uid = await AsyncStorage.getItem(KEYS.userId);
  const tok = await AsyncStorage.getItem(KEYS.token);
  if (uid && tok) headers.authorization = `Bearer ${tok}`;
  return headers;
}

async function post<T>(path: string, body: unknown, timeoutMs = 35_000): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`server ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- Запросы ---------------- */

export function sendChat(opts: {
  messages: ChatMessage[];
  lang: Lang;
  subject?: string;
  grade?: number;
  userId?: number | null;
}) {
  return post<TutorReply>("/api/tutor/chat", opts);
}

/** История с сервера (требует token; [] при ошибке/анониме). */
export async function fetchHistory(userId: number | null): Promise<ChatMessage[]> {
  if (userId == null) return [];
  try {
    const tok = await AsyncStorage.getItem(KEYS.token);
    if (!tok) return [];
    const res = await fetch(`${API_URL}/api/history/${userId}`, {
      headers: { authorization: `Bearer ${tok}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { messages: ChatMessage[] };
    return data.messages ?? [];
  } catch {
    return [];
  }
}
