import "./env.js"; // ДОЛЖЕН быть первым: грузит .env до чтения ключей другими модулями
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  tutorRequestSchema,
  sessionSchema,
  SUBJECTS,
  type TutorReply,
} from "@ai-tutor/common";
import { runTutor, engineName } from "./tutor.js";
import { RateLimiter } from "./rateLimit.js";
import { initDb, isDbEnabled, upsertUser, saveMessage, getHistory, verifyUserToken, getStats } from "./db.js";

const app = express();
// За прокси (Render) req.ip без этого = IP прокси → один бакет на всех → массовые 429.
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3001;
const ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Mini App живёт в Telegram WebView — не блокируем фреймы/CSP.
app.use(helmet({ contentSecurityPolicy: false, frameguard: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: ORIGINS.includes("*") ? true : ORIGINS }));
app.use(express.json({ limit: "64kb" }));

const limiter = new RateLimiter();

void initDb(); // асинхронно поднимает пул; до готовности сервер живёт без БД

app.get("/health", (_req, res) => {
  const provider = process.env.GROQ_API_KEY ? "groq" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "demo";
  res.json({
    ok: true,
    ai: provider !== "demo",
    provider,
    engine: engineName(),
    model: process.env.GROQ_API_KEY
      ? (process.env.GROQ_MODEL || "openai/gpt-oss-120b")
      : (process.env.AI_MODEL || "claude-sonnet-5"),
    db: isDbEnabled() ? "mysql" : "off",
  });
});

app.get("/api/subjects", (_req, res) => {
  res.json(SUBJECTS);
});

/** Регистрация/обновление ученика (по tgId или deviceId). Возвращает токен сессии. */
app.post("/api/session", async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  const user = await upsertUser({
    ...parsed.data,
    lang: parsed.data.lang as "uz" | "ru" | "en",
  });
  if (user === null) {
    // Демо без БД: клиент работает анонимно, история не персистится — это не ошибка.
    return res.status(200).json({ userId: null, token: null, persisted: false });
  }
  return res.json({ userId: user.id, token: user.token, persisted: true });
});

/** История ученика — ТОЛЬКО со своим токеном сессии (иначе IDOR). */
app.get("/api/history/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "invalid_user" });
  }
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!(await verifyUserToken(userId, token))) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const messages = await getHistory(userId, 20);
  res.json({ userId, messages });
});

/** Security-дашборд: статистика чатов и атак. Только с ADMIN_TOKEN. */
app.get("/api/admin/stats", async (req, res) => {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected || req.headers["x-admin-token"] !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const stats = await getStats();
  if (!stats) return res.json({ available: false, reason: "db_off" });
  res.json({ available: true, ...stats });
});

app.post("/api/tutor/chat", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!limiter.take(ip)) {
    return res.status(429).json({ error: "rate_limited" });
  }

  const parsed = tutorRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  // Пишем историю только для валидной пары userId+token (анти-IDOR).
  let authUserId: number | null = null;
  if (parsed.data.userId != null) {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!(await verifyUserToken(parsed.data.userId, token))) {
      return res.status(401).json({ error: "unauthorized" });
    }
    authUserId = parsed.data.userId;
  }

  try {
    const reply: TutorReply = await runTutor(parsed.data);

    // Персистим в MySQL, если клиент авторизован (журнал атак — тоже).
    if (authUserId != null && isDbEnabled()) {
      const lastMsg = parsed.data.messages[parsed.data.messages.length - 1];
      const lang = parsed.data.lang as "uz" | "ru" | "en";
      void saveMessage({
        userId: authUserId,
        role: "user",
        content: lastMsg.content,
        subject: parsed.data.subject ?? null,
        lang,
        blocked: Boolean(reply.blocked),
        blockReason: reply.blocked?.reason ?? null,
      });
      void saveMessage({
        userId: authUserId,
        role: "assistant",
        content: reply.reply,
        subject: parsed.data.subject ?? null,
        lang,
      });
    }

    res.json(reply);
  } catch (err) {
    console.error("[server] unexpected:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "internal" });
  }
});

app.listen(PORT, () => {
  const provider = process.env.GROQ_API_KEY ? `LIVE (Groq/${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"})` : process.env.ANTHROPIC_API_KEY ? `LIVE (Claude)` : "DEMO (no API key)";
  console.log(`🎓 AI Tutor server on :${PORT} — ${provider}`);
});
