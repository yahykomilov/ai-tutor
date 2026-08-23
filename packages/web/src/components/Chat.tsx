import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUBJECTS } from "@ai-tutor/common";
import { askTutor } from "../api.js";
import { useAchievements } from "../useAchievements.js";
import { shareContent } from "../share.js";
import type { Conversation, StoredMsg, Profile } from "../store.js";

/** Лёгкий рендер **жирного** без dangerouslySetInnerHTML (безопасно, через React). */
function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

interface Props {
  conversation: Conversation | null;
  profile: Profile;
  onPersist: (messages: StoredMsg[], subject?: string, grade?: number) => void;
}

export default function Chat({ conversation, profile, onPersist }: Props) {
  const { t } = useTranslation();
  const lang = profile.lang;
  const [subject, setSubject] = useState<string | undefined>(conversation?.subject);
  const [grade, setGrade] = useState<number | undefined>(conversation?.grade ?? profile.grade);
  const [messages, setMessages] = useState<StoredMsg[]>(conversation?.messages ?? []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const { ach, bump } = useAchievements();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function share(text: string) {
    const r = await shareContent({ title: "AI Tutor", text });
    if (r === "copied") {
      setToast(t("share.copied"));
      setTimeout(() => setToast(""), 1500);
    }
  }
  const shareResult = () => share(t("ach.shareText", { solved: ach.solved }));

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: StoredMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await askTutor({ messages: next.map((m) => ({ role: m.role, content: m.content })), subject, grade, lang });
      const full: StoredMsg[] = [...next, { role: "assistant", content: reply.reply, blocked: reply.blocked, demo: reply.demo }];
      setMessages(full);
      onPersist(full, subject, grade);
      if (!reply.blocked) bump();
    } catch {
      const full: StoredMsg[] = [...next, { role: "assistant", content: "⚠️ Error. Try again." }];
      setMessages(full);
      onPersist(full, subject, grade);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-3">
      {/* предметы + класс */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSubject(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${!subject ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          {t("subject.any")}
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${subject === s.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            {s.emoji} {s.label[lang]}
          </button>
        ))}
        <select
          value={grade ?? ""}
          onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">{t("grade")}</option>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>{t("grade")} {g}</option>
          ))}
        </select>
      </div>

      {ach.solved > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs dark:bg-slate-800/60">
          <span className="font-semibold text-brand-700 dark:text-brand-300">{t("ach.badge", { streak: ach.streak, solved: ach.solved })}</span>
          <button onClick={shareResult} className="ml-auto rounded-md bg-brand-600 px-2 py-1 font-semibold text-white transition hover:bg-brand-700">📤 {t("ach.share")}</button>
        </div>
      )}

      {/* лента */}
      <div className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/50 p-4 dark:border-ink-700 dark:bg-ink-900/40">
        {messages.length === 0 && <div className="m-auto max-w-md text-center text-sm text-slate-500 dark:text-slate-400">{t("chat.empty")}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
              {m.blocked && (
                <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {t("chat.blocked")} · {t("sec.layer")} {m.blocked.layer}
                </div>
              )}
              {renderText(m.content)}
              {m.demo && <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("chat.demo")}</div>}
              {m.role === "assistant" && !m.blocked && (
                <button onClick={() => share(m.content)} className="mt-1 block text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-300">📤 {t("share.this")}</button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
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
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("chat.placeholder")}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40">
          {t("chat.send")}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-400">{t("chat.disclaimer")}</p>

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{toast}</div>}
    </div>
  );
}
