import type { ChatMessage, TutorReply, Lang } from "@ai-tutor/common";

const API = (import.meta.env.VITE_API_URL as string | undefined) || "";

export interface AskParams {
  messages: ChatMessage[];
  subject?: string;
  grade?: number;
  lang: Lang;
}

export async function askTutor(params: AskParams): Promise<TutorReply> {
  const res = await fetch(`${API}/api/tutor/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (res.status === 429) {
    return { reply: "⏳ Too many requests — wait a moment.", demo: false };
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as TutorReply;
}
