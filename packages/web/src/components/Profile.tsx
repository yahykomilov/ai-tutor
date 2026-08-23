import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSubject, type Lang } from "@ai-tutor/common";
import { useAchievements } from "../useAchievements.js";
import { shareContent } from "../share.js";

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDay(day: string, lang: Lang, t: (k: string) => string): string {
  const today = dayStr(new Date());
  const yesterday = dayStr(new Date(Date.now() - 86400000));
  if (day === today) return t("profile.today");
  if (day === yesterday) return lang === "ru" ? "Вчера" : lang === "en" ? "Yesterday" : "Kecha";
  return day.slice(5);
}

export default function Profile({ lang }: { lang: Lang }) {
  const { t } = useTranslation();
  const { ach } = useAchievements();
  const [toast, setToast] = useState("");

  async function share() {
    const r = await shareContent({ title: "AI Tutor", text: t("ach.shareText", { solved: ach.solved }) });
    if (r === "copied") {
      setToast(t("share.copied"));
      setTimeout(() => setToast(""), 1500);
    }
  }

  const pct = Math.min(100, ach.solved * 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">{t("profile.title")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("profile.subtitle")}</p>
        </div>
        <button
          onClick={share}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-ink-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-ink-900 dark:text-white"
        >
          📤 {t("ach.share")}
        </button>
      </div>

      {ach.solved === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-ink-900 dark:text-slate-400">
          {t("profile.empty")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-ink-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-lg dark:bg-slate-800">✅</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t("profile.solvedLabel")}</div>
                <div className="text-2xl font-extrabold text-ink-900 dark:text-white">{ach.solved}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-ink-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-lg dark:bg-slate-800">🔥</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t("profile.streakLabel")}</div>
                <div className="text-2xl font-extrabold text-ink-900 dark:text-white">
                  {ach.streak} {t("profile.streakUnit")}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-ink-900 dark:text-white">{t("profile.recentTitle")}</h3>
            <div className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-ink-900">
              {ach.history.map((h, i) => {
                const subj = getSubject(h.subjectId);
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base dark:bg-slate-800">
                      {subj?.emoji ?? "💬"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {subj?.label[lang] ?? t("subject.any")}
                      </div>
                      <div className="text-xs text-slate-400">{t("profile.done")}</div>
                    </div>
                    <div className="shrink-0 text-xs text-slate-400">{formatDay(h.day, lang, t)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-ink-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900 dark:text-white">{t("profile.overallTitle")}</span>
              <span className="text-xs text-slate-400">{t("profile.overallLabel")}</span>
              <span className="text-lg font-extrabold text-ink-900 dark:text-white">{pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-ink-900 dark:bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t("profile.overallHint")}</p>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
