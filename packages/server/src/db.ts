/**
 * MySQL-слой (mysql2/promise, пул). Мягкая деградация:
 * нет MYSQL_HOST или БД недоступна → dbEnabled=false, сервер продолжает
 * работать в stateless/демо-режиме. Демо не должно падать никогда.
 *
 * Схема создаётся автоматически (CREATE TABLE IF NOT EXISTS) — миграции
 * для хакатона держим прямо здесь, воспроизводимо на любой машине.
 */
import mysql from "mysql2/promise";

const CFG = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "ai_tutor",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "ai_tutor",
  connectionLimit: 10,
  connectTimeout: 5000,
};

let pool: mysql.Pool | null = null;
let dbEnabled = false;

export function isDbEnabled(): boolean {
  return dbEnabled;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tg_id      BIGINT NULL UNIQUE,
  device_id  VARCHAR(64) NULL UNIQUE,
  name       VARCHAR(120) NULL,
  lang       ENUM('uz','ru','en') NOT NULL DEFAULT 'uz',
  grade      TINYINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  role         ENUM('user','assistant') NOT NULL,
  content      TEXT NOT NULL,
  subject      VARCHAR(32) NULL,
  lang         ENUM('uz','ru','en') NOT NULL DEFAULT 'uz',
  blocked      BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_user (user_id, created_at),
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export async function initDb(): Promise<boolean> {
  if (!CFG.host) return false; // MySQL не сконфигурирован — это не ошибка
  try {
    pool = mysql.createPool(CFG);
    const conn = await pool.getConnection();
    await conn.query(SCHEMA);
    conn.release();
    dbEnabled = true;
    console.log(`🗄️  MySQL подключён: ${CFG.host}:${CFG.port}/${CFG.database}`);
    return true;
  } catch (err) {
    console.error(
      "[db] MySQL недоступен — работаю без БД:",
      err instanceof Error ? err.message : err,
    );
    pool = null;
    dbEnabled = false;
    return false;
  }
}

export interface UpsertUser {
  tgId?: number | null;
  deviceId?: string | null;
  name?: string | null;
  lang?: "uz" | "ru" | "en";
  grade?: number | null;
}

/** Создаёт или обновляет пользователя, возвращает его id (или null без БД). */
export async function upsertUser(u: UpsertUser): Promise<number | null> {
  if (!dbEnabled || !pool) return null;
  try {
    const key = u.tgId != null ? { tg: u.tgId } : u.deviceId ? { dev: u.deviceId } : null;
    if (!key) return null;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE " +
        ("tg" in key ? "tg_id = ?" : "device_id = ?") +
        " LIMIT 1",
      ["tg" in key ? key.tg : key.dev],
    );
    if (rows.length > 0) {
      const id = rows[0].id as number;
      await pool.execute(
        "UPDATE users SET name = COALESCE(?, name), lang = COALESCE(?, lang), grade = COALESCE(?, grade) WHERE id = ?",
        [u.name ?? null, u.lang ?? null, u.grade ?? null, id],
      );
      return id;
    }
    const [res] = await pool.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (tg_id, device_id, name, lang, grade) VALUES (?, ?, ?, ?, ?)",
      ["tg" in key ? key.tg : null, "dev" in key ? key.dev : null, u.name ?? null, u.lang ?? "uz", u.grade ?? null],
    );
    return res.insertId;
  } catch (err) {
    console.error("[db] upsertUser:", err instanceof Error ? err.message : err);
    return null;
  }
}

export interface SaveMessage {
  userId: number;
  role: "user" | "assistant";
  content: string;
  subject?: string | null;
  lang: "uz" | "ru" | "en";
  blocked?: boolean;
  blockReason?: string | null;
}

export async function saveMessage(m: SaveMessage): Promise<void> {
  if (!dbEnabled || !pool) return;
  try {
    await pool.execute(
      "INSERT INTO messages (user_id, role, content, subject, lang, blocked, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [m.userId, m.role, m.content.slice(0, 20000), m.subject ?? null, m.lang, m.blocked ?? false, m.blockReason ?? null],
    );
  } catch (err) {
    console.error("[db] saveMessage:", err instanceof Error ? err.message : err);
  }
}

/** Последние N сообщений ученика в хронологическом порядке ([] без БД). */
export async function getHistory(userId: number, limit = 20): Promise<
  { role: "user" | "assistant"; content: string }[]
> {
  if (!dbEnabled || !pool) return [];
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT role, content FROM (
         SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
       ) t ORDER BY created_at ASC`,
      [userId, limit],
    );
    return rows.map((r) => ({ role: r.role as "user" | "assistant", content: String(r.content) }));
  } catch (err) {
    console.error("[db] getHistory:", err instanceof Error ? err.message : err);
    return [];
  }
}
