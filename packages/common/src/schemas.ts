import { z } from "zod";
import { LANGS } from "./types.js";
import { SUBJECT_IDS } from "./subjects.js";

export const MAX_MESSAGE_LEN = 4000;
export const MAX_HISTORY = 20;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_LEN),
});

export const tutorRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(MAX_HISTORY),
  subject: z.enum(SUBJECT_IDS as [string, ...string[]]).optional(),
  grade: z.number().int().min(1).max(11).optional(),
  lang: z.enum(LANGS as [string, ...string[]]),
  clientId: z.string().max(64).optional(),
});

export type TutorRequestInput = z.infer<typeof tutorRequestSchema>;
