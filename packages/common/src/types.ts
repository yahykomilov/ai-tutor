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

/** Агрегированная статистика для admin panel (из ветки feat/atxamov99; эндпоинт /api/admin/stats в бэкенде master пока не реализован). */
export interface AdminStats {
  activeStudents: number;
  questionsToday: number;
  blockedToday: number;
  topSubject?: string;
  subjectUsage: { id: string; count: number }[];
  securityLog: { time: string; layer: 1 | 2 | 3; lang: Lang; text: string }[];
}
