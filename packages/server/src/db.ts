/**
 * MySQL-слой (mysql2/promise, пул). Мягкая деградация:
 * нет MYSQL_HOST или БД недоступна → dbEnabled=false, сервер продолжает
 * работать в stateless/демо-режиме. Демо не должно падать никогда.
 *
 * Схема создаётся автоматически (CREATE TABLE IF NOT EXISTS) — миграции
 * для хакатона держим прямо здесь, воспроизводимо на любой машине.
 */
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

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
  token      CHAR(36) NULL UNIQUE,
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

/** Миграции для таблиц, созданных старой версией схемы. */
async function migrate(conn: mysql.PoolConnection): Promise<void> {
  try {
    await conn.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS token CHAR(36) NULL UNIQUE AFTER grade");
  } catch { /* колонка уже есть / старый MySQL без IF NOT EXISTS — игнорируем */ }
}

export async function initDb(): Promise<boolean> {
  if (!CFG.host) return false; // MySQL не сконфигурирован — это не ошибка
  try {
    pool = mysql.createPool(CFG);
    const conn = await pool.getConnection();
    await conn.query(SCHEMA);
    await migrate(conn);
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

/** Создаёт или обновляет пользователя, возвращает id + токен сессии (или null без БД). */
export async function upsertUser(u: UpsertUser): Promise<{ id: number; token: string } | null> {
  if (!dbEnabled || !pool) return null;
  try {
    const byTg = u.tgId != null;
    const deviceId = byTg ? null : (u.deviceId ?? null);
    if (!byTg && !deviceId) return null;

    const selectSql = byTg ? "SELECT id, token FROM users WHERE tg_id = ? LIMIT 1" : "SELECT id, token FROM users WHERE device_id = ? LIMIT 1";
    const selectVal: string | number = byTg ? u.tgId! : deviceId!;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(selectSql, [selectVal]);

    if (rows.length > 0) {
      const id = rows[0].id as number;
      let token = rows[0].token as string | null;
      if (!token) {
        token = randomUUID();
        await pool.execute("UPDATE users SET token = ? WHERE id = ?", [token, id]);
      }
      await pool.execute(
        "UPDATE users SET name = COALESCE(?, name), lang = COALESCE(?, lang), grade = COALESCE(?, grade) WHERE id = ?",
        [u.name ?? null, u.lang ?? null, u.grade ?? null, id],
      );
      return { id, token };
    }
    const token = randomUUID();
    const insertSql =
      "INSERT INTO users (tg_id, device_id, name, lang, grade, token) VALUES (?, ?, ?, ?, ?, ?)";
    const insertVals = [byTg ? u.tgId : null, deviceId, u.name ?? null, u.lang ?? "uz", u.grade ?? null, token];
    const [res] = (await pool.query(insertSql, insertVals)) as [mysql.ResultSetHeader, unknown];
    return { id: res.insertId, token };
  } catch (err) {
    console.error("[db] upsertUser:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Проверяет токен сессии пользователя (защита истории от IDOR). */
export async function verifyUserToken(userId: number, token: string): Promise<boolean> {
  if (!dbEnabled || !pool || !token) return false;
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? AND token = ? LIMIT 1",
      [userId, token],
    );
    return rows.length > 0;
  } catch (err) {
    console.error("[db] verifyUserToken:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Сводка для Security-дашборда (админский эндпоинт). */
export async function getStats(): Promise<{
  totalMessages: number; blockedAttempts: number; activeUsers: number; topReasons: { reason: string; count: number }[];
} | null> {
  if (!dbEnabled || !pool) return null;
  try {
    const [[m], [u], [reasons]] = await Promise.all([
      pool.query<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) AS total, COALESCE(SUM(blocked),0) AS blocked FROM messages WHERE role='user'",
      ),
      pool.query<mysql.RowDataPacket[]>("SELECT COUNT(DISTINCT user_id) AS active FROM messages"),
      pool.query<mysql.RowDataPacket[]>(
        "SELECT block_reason AS reason, COUNT(*) AS count FROM messages WHERE blocked=TRUE AND block_reason IS NOT NULL GROUP BY block_reason ORDER BY count DESC LIMIT 5",
      ),
    ]);
    return {
      totalMessages: Number(m[0]?.total ?? 0),
      blockedAttempts: Number(m[0]?.blocked ?? 0),
      activeUsers: Number(u[0]?.active ?? 0),
      topReasons: (reasons as mysql.RowDataPacket[]).map((r) => ({ reason: String(r.reason), count: Number(r.count) })),
    };
  } catch (err) {
    console.error("[db] getStats:", err instanceof Error ? err.message : err);
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
