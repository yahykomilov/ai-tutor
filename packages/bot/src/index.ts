import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { Bot, InlineKeyboard } from "grammy";
import { SUBJECTS, LANGS, type Lang, type ChatMessage, type TutorReply } from "@ai-tutor/common";

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
}
const sessions = new Map<number, Session>();
const getSession = (id: number): Session =>
  sessions.get(id) ?? (sessions.set(id, { lang: "uz", history: [] }), sessions.get(id)!);

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
  ready: { uz: "Tayyor! Savolingizni yozing 📚", ru: "Готово! Пиши свой вопрос 📚", en: "Ready! Type your question 📚" },
  thinking: { uz: "O'ylayapman…", ru: "Думаю…", en: "Thinking…" },
  openApp: { uz: "📱 Mini ilovani ochish", ru: "📱 Открыть Mini App", en: "📱 Open Mini App" },
} as const;

const bot = new Bot(TOKEN);

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
  const kb = WEB_APP_URL ? new InlineKeyboard().webApp(T.openApp[s.lang], WEB_APP_URL) : undefined;
  await ctx.reply(T.ready[s.lang], { reply_markup: kb });
});

bot.on("message:text", async (ctx) => {
  const s = getSession(chatId(ctx));
  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  s.history.push({ role: "user", content: text });
  s.history = s.history.slice(-12);
  await ctx.replyWithChatAction("typing");

  try {
    const res = await fetch(`${SERVER_URL}/api/tutor/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: s.history, subject: s.subject, lang: s.lang }),
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    const data = (await res.json()) as TutorReply;
    s.history.push({ role: "assistant", content: data.reply });
    await ctx.reply(data.reply);
  } catch (err) {
    console.error("[bot] error:", err instanceof Error ? err.message : err);
    await ctx.reply({ uz: "Xatolik yuz berdi, yana urinib ko'ring 🙏", ru: "Произошла ошибка, попробуй ещё раз 🙏", en: "Something went wrong, try again 🙏" }[s.lang]);
  }
});

bot.catch((err) => console.error("[bot] unhandled:", err.error));

void LANGS; // (используется в типах)
console.log("🤖 AI Tutor bot запускается…");
bot.start({ onStart: (i) => console.log(`✅ Бот @${i.username} на связи`) });
