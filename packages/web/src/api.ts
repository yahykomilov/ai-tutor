import {
  detectInjection,
  DEMO_INJECTION_BLOCK,
  DEMO_TUTOR,
  type ChatMessage,
  type TutorReply,
  type Lang,
} from "@ai-tutor/common";

const API = (import.meta.env.VITE_API_URL as string | undefined) || "";

/**
 * Сессия ученика: deviceId живёт в localStorage, сервер выдаёт userId+token.
 * Без БД на сервере сессия анонимная (persisted:false) — чат всё равно работает.
 */
interface Session {
  userId: number | null;
  token: string | null;
}

let session: Session | null = null;

function localDeviceId(): string {
  let id = localStorage.getItem("ai-tutor-device-id");
  if (!id) {
    id = `web-${crypto.randomUUID()}`;
    localStorage.setItem("ai-tutor-device-id", id);
  }
  return id;
}

export async function ensureSession(lang: Lang): Promise<Session> {
  if (session) return session;
  try {
    const res = await fetch(`${API}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: localDeviceId(), lang }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as Session & { persisted: boolean };
      session = { userId: data.userId, token: data.token };
    }
  } catch {
    /* сеть/сервер недоступны — работаем анонимно */
  }
  session ??= { userId: null, token: null };
  return session;
}

export interface AskParams {
  messages: ChatMessage[];
  subject?: string;
  grade?: number;
  lang: Lang;
}

/**
 * Клиентский фолбэк (Яхё): если сервер недоступен, Layer 1 и демо-ответы
 * работают прямо в браузере — сайт остаётся живым даже как статика на Vercel.
 */
function localFallback(params: AskParams): TutorReply {
  const last = params.messages[params.messages.length - 1];
  const g = detectInjection(last?.content ?? "");
  if (g.injected) {
    return {
      reply: DEMO_INJECTION_BLOCK[params.lang],
      demo: true,
      blocked: { reason: g.reasons.join(","), layer: 1 },
    };
  }
  return { reply: DEMO_TUTOR[params.lang], demo: true };
}

export async function askTutor(params: AskParams): Promise<TutorReply> {
  // Сессия нужна только для персистентности; если сервер лежит — фолбэк ниже.
  const s = await ensureSession(params.lang).catch(() => ({ userId: null, token: null }) as Session);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (s.token && s.userId != null) headers.authorization = `Bearer ${s.token}`;

  try {
    const res = await fetch(`${API}/api/tutor/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...params, ...(s.userId != null ? { userId: s.userId } : {}) }),
      signal: AbortSignal.timeout(40_000),
    });
    if (res.status === 429) {
      return { reply: "⏳ Too many requests — wait a moment.", demo: false };
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as TutorReply;
  } catch {
    return localFallback(params);
  }
}
