import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  detectInjection,
  wrapUserInput,
  DEMO_TUTOR,
  DEMO_INJECTION_BLOCK,
  type TutorReply,
  type Lang,
} from "@ai-tutor/common";
import type { TutorRequestInput } from "@ai-tutor/common";

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim();
const MODEL = process.env.AI_MODEL?.trim() || "claude-sonnet-5";
const client = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

/** Фразы из системного промпта — если утекли в ответ, значит защита пробита. */
const LEAK_MARKERS = [
  "ABSOLUTE RULES",
  "INJECTION RESISTANCE",
  "REFUSE-AND-REDIRECT",
  "<student_message>",
  "You are \"AI Tutor\"",
];

const BUSY: Record<Lang, string> = {
  uz: "Hozir biroz bandman, iltimos yana bir marta yuboring 🙏",
  ru: "Сейчас немного занят, попробуй отправить ещё раз 🙏",
  en: "I'm a bit busy right now, please try sending again 🙏",
};

/**
 * Layer 3 — валидация вывода. Если модель случайно раскрыла системный промпт,
 * не отдаём это ученику.
 */
function validateOutput(text: string, lang: Lang): { text: string; leaked: boolean } {
  const leaked = LEAK_MARKERS.some((m) => text.includes(m));
  if (leaked) {
    return { text: DEMO_INJECTION_BLOCK[lang], leaked: true };
  }
  return { text: text.trim(), leaked: false };
}

export async function runTutor(req: TutorRequestInput): Promise<TutorReply> {
  const lang = req.lang as Lang;
  const last = req.messages[req.messages.length - 1];

  // --- Layer 1: детект инъекции во входящем сообщении ученика ---
  const guard = detectInjection(last.content);
  if (guard.injected) {
    return {
      reply: DEMO_INJECTION_BLOCK[lang],
      demo: !client,
      blocked: { reason: guard.reasons.join(","), layer: 1 },
    };
  }

  // --- ДЕМО-режим (нет ключа): заглушка по тем же правилам ---
  if (!client) {
    return { reply: DEMO_TUTOR[lang], demo: true };
  }

  // --- Layer 2: делимитированный ввод + системный промпт ---
  const system = buildSystemPrompt({ lang, subject: req.subject, grade: req.grade });
  const messages = req.messages.map((m) => ({
    role: m.role,
    content: m.role === "user" ? wrapUserInput(m.content) : m.content,
  }));

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages,
    });
    const raw = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // --- Layer 3: проверка вывода ---
    const checked = validateOutput(raw || DEMO_TUTOR[lang], lang);
    return {
      reply: checked.text,
      demo: false,
      ...(checked.leaked ? { blocked: { reason: "output-leak", layer: 3 as const } } : {}),
    };
  } catch (err) {
    console.error("[tutor] AI error:", err instanceof Error ? err.message : err);
    return { reply: BUSY[lang], demo: false };
  }
}
