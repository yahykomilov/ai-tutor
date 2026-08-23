import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env из корня монорепо (приоритет), затем локальный packages/server/.env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  tutorRequestSchema,
  sessionSchema,
  SUBJECTS,
  type TutorReply,
} from "@ai-tutor/common";
import { runTutor } from "./tutor.js";
import { RateLimiter } from "./rateLimit.js";
import { initDb, isDbEnabled, upsertUser, saveMessage, getHistory } from "./db.js";

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
  res.json({
    ok: true,
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.AI_MODEL || "claude-sonnet-5",
    db: isDbEnabled() ? "mysql" : "off",
  });
});

app.get("/api/subjects", (_req, res) => {
  res.json(SUBJECTS);
});

/** Регистрация/обновление ученика (по tgId или deviceId). */
app.post("/api/session", async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }
  const userId = await upsertUser({
    ...parsed.data,
    lang: parsed.data.lang as "uz" | "ru" | "en",
  });
  if (userId === null) {
    return res.status(200).json({ userId: null, persisted: false }); // демо без БД — не ошибка
  }
  return res.json({ userId, persisted: true });
});

/** История ученика из MySQL (пустой список без БД). */
app.get("/api/history/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "invalid_user" });
  }
  const messages = await getHistory(userId, 20);
  res.json({ userId, messages });
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

  try {
    const reply: TutorReply = await runTutor(parsed.data);

    // Персистим в MySQL, если клиент передал userId (журнал атак — тоже).
    if (parsed.data.userId && isDbEnabled()) {
      const lastMsg = parsed.data.messages[parsed.data.messages.length - 1];
      const lang = parsed.data.lang as "uz" | "ru" | "en";
      void saveMessage({
        userId: parsed.data.userId,
        role: "user",
        content: lastMsg.content,
        subject: parsed.data.subject ?? null,
        lang,
        blocked: Boolean(reply.blocked),
        blockReason: reply.blocked?.reason ?? null,
      });
      void saveMessage({
        userId: parsed.data.userId,
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
  const mode = process.env.ANTHROPIC_API_KEY ? "LIVE (Claude)" : "DEMO (no API key)";
  console.log(`🎓 AI Tutor server on :${PORT} — ${mode}`);
});
