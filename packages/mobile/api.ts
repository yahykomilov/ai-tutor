/** API-клиент к серверу AI Tutor (packages/server). Типы зеркалят @ai-tutor/common. */
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

async function post<T>(path: string, body: unknown, timeoutMs = 35_000): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`server ${res.status}`);
  return (await res.json()) as T;
}

export function createSession(deviceId: string, lang: Lang) {
  return post<{ userId: number | null; persisted: boolean }>("/api/session", { deviceId, lang }, 8000);
}

export function sendChat(opts: {
  messages: ChatMessage[];
  lang: Lang;
  subject?: string;
  userId?: number | null;
}) {
  return post<TutorReply>("/api/tutor/chat", opts);
}
