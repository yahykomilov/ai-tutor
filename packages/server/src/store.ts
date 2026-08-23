import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ChatMessage } from "@ai-tutor/common";

/**
 * Лёгкое файловое хранилище пользователей (JSON на диске) — без внешней БД,
 * но НЕ в памяти: переживает перезапуск сервера. Достаточно для хакатон-демо
 * с реальными аккаунтами; для прод-нагрузки стоит заменить на настоящую БД.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  grade?: number;
  lang?: "uz" | "ru" | "en";
  createdAt: string;
  /** Сохранённые чаты по предмету ("general" — без предмета). */
  chats: Record<string, ChatMessage[]>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

function load(): Record<string, User> {
  if (!existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Record<string, User>;
  } catch {
    return {};
  }
}

function persist(users: Record<string, User>) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
}

let users = load();

export function findOrCreateGoogleUser(google: { sub: string; email: string; name: string; picture?: string }): User {
  const id = `google:${google.sub}`;
  const existing = users[id];
  if (existing) {
    existing.name = google.name;
    existing.picture = google.picture;
    persist(users);
    return existing;
  }
  const user: User = {
    id,
    email: google.email,
    name: google.name,
    picture: google.picture,
    createdAt: new Date().toISOString(),
    chats: {},
  };
  users[id] = user;
  persist(users);
  return user;
}

export function getUser(id: string): User | undefined {
  return users[id];
}

export function updateUser(id: string, patch: Partial<Pick<User, "name" | "grade" | "lang">>): User | undefined {
  const u = users[id];
  if (!u) return undefined;
  Object.assign(u, patch);
  persist(users);
  return u;
}

export function saveChatThread(id: string, subject: string, messages: ChatMessage[]): void {
  const u = users[id];
  if (!u) return;
  u.chats[subject] = messages.slice(-40);
  persist(users);
}

export function getChatThread(id: string, subject: string): ChatMessage[] {
  return users[id]?.chats[subject] ?? [];
}

export function listChatSubjects(id: string): string[] {
  return Object.keys(users[id]?.chats ?? {});
}
