export type Lang = "uz" | "ru" | "en";
export const LANGS: Lang[] = ["uz", "ru", "en"];

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TutorRequest {
  messages: ChatMessage[];
  subject?: string;
  grade?: number;
  lang: Lang;
  /** Анонимный id клиента (localStorage, без PII) — только для агрегированной статистики (admin panel). */
  clientId?: string;
}

export interface TutorReply {
  reply: string;
  /** true, если сервер работает без ключа (заготовленный ответ). */
  demo: boolean;
  /** заполняется, если ввод был заблокирован защитой. */
  blocked?: {
    reason: string;
    layer: 1 | 2 | 3;
  };
}

/** Агрегированная статистика для admin panel — реальные данные, собранные сервером в рантайме. */
export interface AdminStats {
  activeStudents: number;
  questionsToday: number;
  blockedToday: number;
  topSubject?: string;
  subjectUsage: { id: string; count: number }[];
  securityLog: { time: string; layer: 1 | 2 | 3; lang: Lang; text: string }[];
}
