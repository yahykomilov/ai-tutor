import type { Lang } from "./types.js";

/**
 * Ответы для ДЕМО-режима (когда нет GROQ_API_KEY). Нужны, чтобы демонстрация
 * никогда не падала «в ноль». Это НЕ настоящий тьютор — просто честная заглушка,
 * которая ведёт себя по тем же правилам (учит, а не решает; отказ на не-учебное).
 */

export const DEMO_REFUSAL: Record<Lang, string> = {
  uz: "Men faqat maktab darslari bo'yicha yordam beraman 🙂 Keling, biror mavzuni birga o'rganamiz — masalan, matematika yoki fizikadan savol bering.",
  ru: "Я помогаю только по школьным урокам 🙂 Давай разберём какую-нибудь тему — задай вопрос, например, по математике или физике.",
  en: "I only help with school lessons 🙂 Let's study a topic together — ask me something from, say, math or physics.",
};

export const DEMO_INJECTION_BLOCK: Record<Lang, string> = {
  uz: "Ko'rsatmalarimni o'zgartirishga urinishni sezdim — lekin men doim tutor bo'lib qolaman. Qaysi mavzuni tushuntirib beray? 📚",
  ru: "Похоже на попытку изменить мои правила — но я остаюсь тьютором 🙂 Какую тему объяснить? 📚",
  en: "That looks like an attempt to change my rules — but I stay a tutor 🙂 Which topic should I explain? 📚",
};

export const DEMO_TUTOR: Record<Lang, string> = {
  uz: "[DEMO] Zo'r savol! Keling, qadamma-qadam o'ylaymiz. Avval: masalada nima berilgan va nima topish kerak? Yozib ko'r-chi, keyin birinchi qadamni birga qo'yamiz. (Haqiqiy javoblar uchun GROQ_API_KEY ni .env ga qo'shing.)",
  ru: "[DEMO] Отличный вопрос! Давай думать по шагам. Сначала: что дано в задаче и что нужно найти? Напиши, а потом вместе сделаем первый шаг. (Для настоящих ответов добавь GROQ_API_KEY в .env.)",
  en: "[DEMO] Great question! Let's think step by step. First: what is given and what do we need to find? Write it down, then we'll take the first step together. (Add GROQ_API_KEY to .env for real answers.)",
};
