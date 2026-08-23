import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { Bot, InlineKeyboard, type Context } from "grammy";
import { SUBJECTS, LANGS, detectInjection, DEMO_INJECTION_BLOCK, DEMO_TUTOR, type Lang, type ChatMessage, type TutorReply } from "@ai-tutor/common";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const SERVER_URL = process.env.SERVER_URL?.trim() || "http://localhost:3001";
const WEB_APP_URL = process.env.WEB_APP_URL?.trim() || "";

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN не задан в .env — бот не запущен.");
  process.exit(1);
}

interface Session {
  lang: Lang;
  subject?: string;
  history: ChatMessage[];
  /** id на сервере (MySQL) — если БД включена, история ученика персистится. */
  serverUserId?: number | null;
  registered?: boolean;
}
const sessions = new Map<number, Session>();
const getSession = (id: number): Session =>
  sessions.get(id) ?? (sessions.set(id, { lang: "uz", history: [] }), sessions.get(id)!);

/** Однократная регистрация ученика на сервере по tg_id. */
async function registerIfNeeded(s: Session, tgId: number): Promise<void> {
  if (s.registered) return;
  s.registered = true; // не ретраим спамом; при ошибке останемся анонимными
  try {
    const res = await fetch(`${SERVER_URL}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tgId, lang: s.lang }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as { userId: number | null };
      s.serverUserId = data.userId;
    }
  } catch {
    /* сервер недоступен — бот продолжает работать в памяти */
  }
}

/** id чата надёжно: chat.id, иначе from.id (для command/message всегда есть). */
const chatId = (ctx: { chat?: { id: number }; from?: { id: number } }): number =>
  ctx.chat?.id ?? ctx.from!.id;

const T = {
  welcome: {
    uz: "Salom! Men *AI Tutor* — maktab darslaringizda yordam beraman 🎓\nFaqat o'quv mavzulari bo'yicha. Tilni tanlang:",
    ru: "Привет! Я *AI Tutor* — помогаю со школьными уроками 🎓\nТолько по учёбе. Выбери язык:",
    en: "Hi! I'm *AI Tutor* — I help with school lessons 🎓\nStudy topics only. Choose a language:",
  },
  pickSubject: { uz: "Fanni tanlang (yoki savolni shundoq yozing):", ru: "Выбери предмет (или просто задай вопрос):", en: "Pick a subject (or just ask):" },
  ready: {
    uz: (subj: string) => `Tayyor! *${subj}* bo'yicha savolingizni yozing 📚`,
    ru: (subj: string) => `Готово! Пиши свой вопрос по предмету *${subj}* 📚`,
    en: (subj: string) => `Ready! Type your question about *${subj}* 📚`,
  },
  thinking: { uz: "🤔 O'ylayapman…", ru: "🤔 Думаю…", en: "🤔 Thinking…" },
  openApp: { uz: "📱 Mini ilovani ochish", ru: "📱 Открыть Mini App", en: "📱 Open Mini App" },
  streak: {
    uz: (n: number) => (n >= 3 ? `\n\n🔥 ${n}-savol shu suhbatda — zo'r ketyapsan!` : ""),
    ru: (n: number) => (n >= 3 ? `\n\n🔥 ${n}-й вопрос в этом чате — отличный темп!` : ""),
    en: (n: number) => (n >= 3 ? `\n\n🔥 Question #${n} in this chat — great streak!` : ""),
  },
} as const;

const bot = new Bot(TOKEN);

/** AI отвечает GFM-разметкой (**bold**, ### заголовки) — Telegram legacy Markdown
 *  умеет только *bold*; заголовки не поддерживает вовсе (показал бы решётки как есть). */
function toTelegramMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*");
}

/** Безопасная отправка/редактирование с форматированием: если Telegram не смог распарсить
 *  сущности (нестандартные символы от LLM), откатываемся на голый текст — ответ не теряется. */
async function sendFormatted(ctx: Context, text: string, editMessageId?: number): Promise<void> {
  const formatted = toTelegramMarkdown(text);
  try {
    if (editMessageId) await ctx.api.editMessageText(chatId(ctx), editMessageId, formatted, { parse_mode: "Markdown" });
    else await ctx.reply(formatted, { parse_mode: "Markdown" });
  } catch {
    const plain = text.replace(/\*\*/g, "");
    if (editMessageId) await ctx.api.editMessageText(chatId(ctx), editMessageId, plain).catch(() => ctx.reply(plain));
    else await ctx.reply(plain);
  }
}

function langKeyboard() {
  const kb = new InlineKeyboard();
  kb.text("🇺🇿 O'zbekcha", "lang:uz").text("🇷🇺 Русский", "lang:ru").text("🇬🇧 English", "lang:en");
  return kb;
}

function subjectKeyboard(lang: Lang) {
  const kb = new InlineKeyboard();
  SUBJECTS.forEach((s, i) => {
    kb.text(`${s.emoji} ${s.label[lang]}`, `subj:${s.id}`);
    if ((i + 1) % 2 === 0) kb.row();
  });
  return kb;
}

bot.command("start", async (ctx) => {
  const s = getSession(chatId(ctx));
  s.history = [];
  await ctx.reply(T.welcome[s.lang], { parse_mode: "Markdown", reply_markup: langKeyboard() });
});

bot.command("help", async (ctx) => {
  const s = getSession(chatId(ctx));
  await ctx.reply(
    { uz: "Savol yozing — men tushuntiraman. /subject — fan tanlash, /start — qayta boshlash.", ru: "Напиши вопрос — я объясню. /subject — выбрать предмет, /start — заново.", en: "Ask a question — I'll explain. /subject — pick subject, /start — restart." }[s.lang],
  );
});

bot.command("subject", async (ctx) => {
  const s = getSession(chatId(ctx));
  await ctx.reply(T.pickSubject[s.lang], { reply_markup: subjectKeyboard(s.lang) });
});

bot.callbackQuery(/^lang:(uz|ru|en)$/, async (ctx) => {
  const s = getSession(chatId(ctx));
  s.lang = ctx.match![1] as Lang;
  await ctx.answerCallbackQuery();
  await ctx.reply(T.pickSubject[s.lang], { reply_markup: subjectKeyboard(s.lang) });
});

bot.callbackQuery(/^subj:(.+)$/, async (ctx) => {
  const s = getSession(chatId(ctx));
  s.subject = ctx.match![1];
  await ctx.answerCallbackQuery();
  const subjLabel = SUBJECTS.find((x) => x.id === s.subject)?.label[s.lang] ?? s.subject;
  const kb = WEB_APP_URL ? new InlineKeyboard().webApp(T.openApp[s.lang], WEB_APP_URL) : undefined;
  await ctx.reply(T.ready[s.lang](subjLabel), { parse_mode: "Markdown", reply_markup: kb });
});

bot.on("message:text", async (ctx) => {
  const s = getSession(chatId(ctx));
  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  void registerIfNeeded(s, chatId(ctx));

  s.history.push({ role: "user", content: text });
  s.history = s.history.slice(-12);
  const questionsAsked = s.history.filter((m) => m.role === "user").length;

  // Мгновенная реакция: chat-action + плейсхолдер-сообщение, которое потом заменяем ответом —
  // ощущается живее, чем голая «печатает…», которая у Telegram гаснет через ~5 сек.
  const [, thinkingMsg] = await Promise.all([ctx.replyWithChatAction("typing"), ctx.reply(T.thinking[s.lang])]);

  try {
    const res = await fetch(`${SERVER_URL}/api/tutor/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: s.history,
        subject: s.subject,
        lang: s.lang,
        ...(s.serverUserId != null ? { userId: s.serverUserId } : {}),
      }),
      signal: AbortSignal.timeout(35_000), // не виснем в «печатает…» вечность
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    const data = (await res.json()) as TutorReply;
    s.history.push({ role: "assistant", content: data.reply });
    const withStreak = data.reply + (data.blocked ? "" : T.streak[s.lang](questionsAsked));
    await sendFormatted(ctx, withStreak, thinkingMsg.message_id);
  } catch (err) {
    // Сервер недоступен → локальный фолбэк: защита (Layer 1) + демо прямо в боте, не падаем.
    console.error("[bot] server unreachable, local fallback:", err instanceof Error ? err.message : err);
    const g = detectInjection(text);
    const reply = g.injected ? DEMO_INJECTION_BLOCK[s.lang] : DEMO_TUTOR[s.lang];
    s.history.push({ role: "assistant", content: reply });
    await sendFormatted(ctx, reply, thinkingMsg.message_id);
  }
});

bot.catch((err) => console.error("[bot] unhandled:", err.error));

void LANGS; // (используется в типах)
console.log("🤖 AI Tutor bot запускается…");
bot.start({ onStart: (i) => console.log(`✅ Бот @${i.username} на связи`) });
