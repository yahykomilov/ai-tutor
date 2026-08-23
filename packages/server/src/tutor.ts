import {
  buildSystemPrompt,
  detectInjectionInHistory,
  wrapUserInput,
  wrapAssistantHistory,
  DEMO_TUTOR,
  DEMO_INJECTION_BLOCK,
  type TutorReply,
  type Lang,
} from "@ai-tutor/common";
import type { TutorRequestInput } from "@ai-tutor/common";

/**
 * Провайдер: ТОЛЬКО Groq (быстрый, дешёвый). Нет ключа — демо-режим.
 * Все слои защиты обязательны независимо от провайдера:
 * Layer 1 — детект инъекции по всей истории, Layer 2 — изоляция ввода,
 * Layer 3 — валидация вывода на утечку промпта.
 */
const GROQ_KEY = process.env.GROQ_API_KEY?.trim();
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

type Provider = "groq" | "demo";
const PROVIDER: Provider = GROQ_KEY ? "groq" : "demo";

/** Фразы из системного промпта — если утекли в ответ, значит защита пробита. */
const LEAK_MARKERS = [
  "ABSOLUTE RULES",
  "INJECTION RESISTANCE",
  "REFUSE-AND-REDIRECT",
  "<student_message>",
  "<assistant_history>",
  'You are "AI Tutor"',
];

const BUSY: Record<Lang, string> = {
  uz: "Hozir biroz bandman, iltimos yana bir marta yuboring 🙏",
  ru: "Сейчас немного занят, попробуй отправить ещё раз 🙏",
  en: "I'm a bit busy right now, please try sending again 🙏",
};

/** Layer 3 — валидация вывода: утечка системного промпта не доходит до ученика. */
function validateOutput(text: string, lang: Lang): { text: string; leaked: boolean } {
  const leaked = LEAK_MARKERS.some((m) => text.includes(m));
  if (leaked) return { text: DEMO_INJECTION_BLOCK[lang], leaked: true };
  return { text: text.trim(), leaked: false };
}

/** Groq — OpenAI-совместимый API. */
async function callGroq(system: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 700,
      temperature: 0.6,
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("groq empty response");
  return text;
}

export async function runTutor(req: TutorRequestInput): Promise<TutorReply> {
  const lang = req.lang as Lang;

  // --- Layer 1: детект инъекции ПО ВСЕЙ истории (не только последнее сообщение):
  // травить можно и через старые user-сообщения, и через подделанный assistant-ход.
  const guard = detectInjectionInHistory(req.messages);
  if (guard.injected) {
    return {
      reply: DEMO_INJECTION_BLOCK[lang],
      demo: PROVIDER === "demo",
      blocked: { reason: guard.reasons.join(","), layer: 1 },
    };
  }

  // --- ДЕМО-режим (нет ключа): заглушка по тем же правилам ---
  if (PROVIDER === "demo") {
    return { reply: DEMO_TUTOR[lang], demo: true };
  }

  // --- Layer 2: делимитированный ввод + системный промпт ---
  const system = buildSystemPrompt({ lang, subject: req.subject, grade: req.grade });
  const messages = req.messages.map((m) => ({
    role: m.role,
    content:
      m.role === "user"
        ? wrapUserInput(m.content)
        : wrapAssistantHistory(m.content), // клиентские assistant-ходы — тоже ненадёжные
  }));

  try {
    const raw = await callGroq(system, messages);

    // --- Layer 3: проверка вывода ---
    const checked = validateOutput(raw || DEMO_TUTOR[lang], lang);
    return {
      reply: checked.text,
      demo: false,
      ...(checked.leaked ? { blocked: { reason: "output-leak", layer: 3 as const } } : {}),
    };
  } catch (err) {
    console.error(`[tutor] ${PROVIDER} error:`, err instanceof Error ? err.message : err);
    return { reply: BUSY[lang], demo: false };
  }
}

/** Совместимость с вебом Яхё: имя активного движка (groq | demo). */
export function engineName(): string {
  return PROVIDER;
}
