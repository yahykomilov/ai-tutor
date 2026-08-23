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
import { tutorRequestSchema, SUBJECTS, type TutorReply } from "@ai-tutor/common";
import { runTutor, engineName } from "./tutor.js";
import { RateLimiter } from "./rateLimit.js";

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
