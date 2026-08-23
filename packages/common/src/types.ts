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
