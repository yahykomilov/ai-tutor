/**
 * Анонимный, случайный id устройства — только чтобы backend мог посчитать
 * "faol o'quvchilar" (сколько разных клиентов сегодня писали боту) для admin
 * panel. Никакого PII, не связан с профилем/именем.
 */
const KEY = "ai-tutor-client-id";

export function getClientId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "anon";
  }
}
