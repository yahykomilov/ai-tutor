import {
  detectInjection,
  DEMO_INJECTION_BLOCK,
  DEMO_TUTOR,
  type ChatMessage,
  type TutorReply,
  type Lang,
} from "@ai-tutor/common";

const API = (import.meta.env.VITE_API_URL as string | undefined) || "";

export interface AskParams {
  messages: ChatMessage[];
  subject?: string;
  grade?: number;
  lang: Lang;
}

/**
 * Клиентский фолбэк: если сервер недоступен (нет деплоя бэка / упал), защита
 * Layer 1 и демо-ответы работают прямо в браузере — сайт остаётся живым даже
 * как статика на Vercel. Security demo при этом реальный, не бутафория:
 * detectInjection — тот же код, что на сервере (пакет common).
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
  try {
    const res = await fetch(`${API}/api/tutor/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.status === 429) return { reply: "⏳ Too many requests — wait a moment.", demo: false };
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as TutorReply;
  } catch {
    return localFallback(params);
  }
}
