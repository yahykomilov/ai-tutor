import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAchievements } from "../useAchievements.js";
import { shareContent } from "../share.js";

export default function Profile() {
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">{t("profile.title")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("profile.subtitle")}</p>
      </div>

      {ach.solved === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
          {t("profile.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-brand-50 p-5 text-center dark:bg-slate-800/60">
            <div className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">{ach.solved}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("profile.solvedLabel")}</div>
          </div>
          <div className="rounded-2xl bg-brand-50 p-5 text-center dark:bg-slate-800/60">
            <div className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">🔥 {ach.streak}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("profile.streakLabel")}</div>
          </div>
        </div>
      )}

      <button
        onClick={share}
        disabled={ach.solved === 0}
        className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
      >
        📤 {t("ach.share")}
      </button>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
