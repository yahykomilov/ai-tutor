import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUBJECTS, type Lang } from "@ai-tutor/common";
import { askTutor, loadChatThread, saveChatThread } from "../api.js";
import { useAchievements } from "../useAchievements.js";
import { useProfile } from "../useProfile.js";
import { shareContent } from "../share.js";

interface Msg {
  role: "user" | "assistant";
  content: string;
  blocked?: { reason: string; layer: number };
  demo?: boolean;
}

export default function Chat({
  lang,
  initialSubject,
  token,
  defaultGrade,
}: {
  lang: Lang;
  initialSubject?: string;
  token?: string | null;
  defaultGrade?: number;
}) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState<string | undefined>(initialSubject);
  const [grade, setGrade] = useState<number | undefined>(defaultGrade);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const { ach, bump } = useAchievements();
  const { profile } = useProfile();
  const endRef = useRef<HTMLDivElement>(null);
  const subjectKey = subject ?? "general";

  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    if (defaultGrade !== undefined) setGrade(defaultGrade);
  }, [defaultGrade]);

  // Saqlangan chat tarixi — faqat Google akkaunt bilan kirganlarda (token bor).
  useEffect(() => {
    if (!token) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    loadChatThread(token, subjectKey).then((loaded) => {
      if (!cancelled) setMessages(loaded.map((m) => ({ role: m.role, content: m.content })));
    });
    return () => {
      cancelled = true;
    };
  }, [token, subjectKey]);

  async function share(text: string) {
    const r = await shareContent({ title: "AI Tutor", text });
    if (r === "copied") {
      setToast(t("share.copied"));
      setTimeout(() => setToast(""), 1500);
    }
  }
  const shareResult = () => share(t("ach.shareText", { solved: ach.solved }));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await askTutor({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        subject,
        grade,
        lang,
      });
      const withReply: Msg[] = [...next, { role: "assistant", content: reply.reply, blocked: reply.blocked, demo: reply.demo }];
      setMessages(withReply);
      if (!reply.blocked) bump(subject);
      if (token) saveChatThread(token, subjectKey, withReply.map((m) => ({ role: m.role, content: m.content })));
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* выбор предмета/класса */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSubject(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !subject ? "bg-ink-900 text-white dark:bg-brand-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {t("subject.any")}
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              subject === s.id ? "bg-ink-900 text-white dark:bg-brand-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {s.emoji} {s.label[lang]}
          </button>
        ))}
        <select
          value={grade ?? ""}
          onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-ink-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t("grade")}</option>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>
              {t("grade")} {g}
            </option>
          ))}
        </select>
      </div>

      {/* виральность: достижения + поделиться результатом */}
      {ach.solved > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs dark:bg-slate-800/60">
          <span className="font-semibold text-brand-700 dark:text-brand-300">
            {t("ach.badge", { streak: ach.streak, solved: ach.solved })}
          </span>
          <button
            onClick={shareResult}
            className="ml-auto rounded-md bg-brand-500 px-2 py-1 font-semibold text-white transition hover:bg-brand-600"
          >
            📤 {t("ach.share")}
          </button>
        </div>
      )}

      {/* лента сообщений */}
      <div className="chat-scroll flex h-[58vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-ink-900/40">
        {messages.length === 0 && (
          <div className="m-auto max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
            {profile.name ? t("chat.emptyNamed", { name: profile.name }) : t("chat.empty")}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-brand-500 text-white"
                  : "rounded-bl-sm bg-brand-50 text-ink-900 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {m.blocked && (
                <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {t("chat.blocked")} · {t("sec.layer")} {m.blocked.layer}
                </div>
              )}
              {m.content}
              {m.demo && (
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("chat.demo")}</div>
              )}
              {m.role === "assistant" && !m.blocked && (
                <button
                  onClick={() => share(m.content)}
                  className="mt-1 block text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-300"
                >
                  📤 {t("share.this")}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-brand-50 px-4 py-3 dark:bg-slate-800">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-blink rounded-full bg-slate-400" />
                <span className="h-2 w-2 animate-blink rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }} />
                <span className="h-2 w-2 animate-blink rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ввод */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("chat.placeholder")}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-40 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {t("chat.send")}
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-400">{t("chat.disclaimer")}</p>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
