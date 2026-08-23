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
import { z } from "zod";
import { tutorRequestSchema, chatMessageSchema, SUBJECTS, type TutorReply, type Lang } from "@ai-tutor/common";
import { runTutor, engineName } from "./tutor.js";
import { RateLimiter } from "./rateLimit.js";
import { recordRequest, getStats } from "./stats.js";
import { verifyGoogleIdToken, signAppToken, requireAuth, type AuthedRequest } from "./auth.js";
import { findOrCreateGoogleUser, getUser, updateUser, saveChatThread, getChatThread } from "./store.js";

const app = express();
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, engine: engineName(), model: process.env.AI_MODEL || "claude-sonnet-5" });
});

app.get("/api/subjects", (_req, res) => {
  res.json(SUBJECTS);
});

app.get("/api/admin/stats", (_req, res) => {
  res.json(getStats());
});

// --- Auth: Sign in with Google (ID-token, без client secret) ---
app.post("/api/auth/google", async (req, res) => {
  const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : "";
  if (!idToken) return res.status(400).json({ error: "invalid_request" });
  try {
    const profile = await verifyGoogleIdToken(idToken);
    const user = findOrCreateGoogleUser(profile);
    const token = signAppToken(user.id);
    res.json({ token, user });
  } catch (err) {
    console.error("[auth] google verify failed:", err instanceof Error ? err.message : err);
    res.status(401).json({ error: "google_auth_failed" });
  }
});

app.get("/api/me", requireAuth, (req: AuthedRequest, res) => {
  const user = getUser(req.userId!);
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

const patchMeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  grade: z.number().int().min(1).max(11).optional(),
  lang: z.enum(["uz", "ru", "en"]).optional(),
});

app.patch("/api/me", requireAuth, (req: AuthedRequest, res) => {
  const parsed = patchMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });
  const user = updateUser(req.userId!, parsed.data);
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

// --- Сохранённые чаты (по предмету) для авторизованного пользователя ---
app.get("/api/chats/:subject", requireAuth, (req: AuthedRequest, res) => {
  res.json({ messages: getChatThread(req.userId!, req.params.subject) });
});

app.post("/api/chats/:subject", requireAuth, (req: AuthedRequest, res) => {
  const parsed = z.array(chatMessageSchema).max(200).safeParse(req.body?.messages);
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });
  saveChatThread(req.userId!, req.params.subject, parsed.data);
  res.json({ ok: true });
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
    const last = parsed.data.messages[parsed.data.messages.length - 1];
    recordRequest({
      clientId: parsed.data.clientId,
      subject: parsed.data.subject,
      lang: parsed.data.lang as Lang,
      blocked: reply.blocked,
      lastMessage: last?.content ?? "",
    });
    res.json(reply);
  } catch (err) {
    console.error("[server] unexpected:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "internal" });
  }
});

app.listen(PORT, () => {
  const mode =
    { api: "LIVE (Claude)", groq: "LIVE (Groq)", cli: "LIVE (local Claude CLI)", demo: "DEMO (no API key)" }[
      engineName()
    ];
  console.log(`🎓 AI Tutor server on :${PORT} — ${mode}`);
});
