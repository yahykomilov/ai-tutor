import { useTranslation } from "react-i18next";
import { useApp } from "../context.js";
import type { Lang } from "@ai-tutor/common";
import type { Theme } from "../store.js";

const LANGS: Lang[] = ["uz", "ru", "en"];
const THEMES: { id: Theme; icon: string }[] = [
  { id: "light", icon: "☀️" },
  { id: "dark", icon: "🌙" },
  { id: "system", icon: "🖥️" },
];

export default function Settings({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { user, profile, updateProfile, signOut, hasSupabase } = useApp();

  function setLang(l: Lang) {
    i18n.changeLanguage(l);
    updateProfile({ lang: l });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md animate-fade-up overflow-y-auto rounded-t-3xl border border-white/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{t("settings.title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        {/* профиль */}
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("settings.name")}</label>
        <input
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          placeholder={t("auth.name")}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("settings.grade")}</label>
        <select
          value={profile.grade ?? ""}
          onChange={(e) => updateProfile({ grade: e.target.value ? Number(e.target.value) : undefined })}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">—</option>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>{t("grade")} {g}</option>
          ))}
        </select>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("settings.language")}</label>
        <div className="mb-4 flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold uppercase transition ${
                profile.lang === l ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("settings.theme")}</label>
        <div className="mb-5 flex gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => updateProfile({ theme: th.id })}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                profile.theme === th.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {th.icon} {t(`theme.${th.id}`)}
            </button>
          ))}
        </div>

        {/* аккаунт */}
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("settings.account")}</div>
          <div className="mb-3 text-sm text-slate-700 dark:text-slate-200">
            {user?.isGuest ? `👤 ${t("auth.guest")}` : `✉️ ${user?.email ?? user?.name}`}
          </div>
          {user?.isGuest && !hasSupabase && <p className="mb-3 text-[11px] text-slate-400">{t("settings.guestNote")}</p>}
          <button onClick={signOut} className="w-full rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300">
            {t("settings.signout")}
          </button>
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700">
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}
