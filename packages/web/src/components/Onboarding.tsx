import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "../useProfile.js";

export default function Onboarding({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  const { profile, setProfile } = useProfile();
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<number | undefined>(profile.grade);

  function start() {
    setProfile({ name: name.trim(), grade });
    onStart();
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <img src="/logo.png" alt="AI Tutor" className="h-20 w-20 rounded-2xl shadow-sm" />
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">
          {profile.name ? t("kirish.welcomeBack", { name: profile.name }) : t("appName")}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("tagline")}</p>
      </div>

      <div className="grid w-full max-w-md gap-3 text-left">
        {(["kirish.value1", "kirish.value2", "kirish.value3"] as const).map((k) => (
          <div
            key={k}
            className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-ink-900 dark:bg-slate-800/60 dark:text-slate-100"
          >
            <span>✅</span>
            <span>{t(k)}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl border border-slate-200 bg-white/60 p-4 text-left dark:border-slate-800 dark:bg-slate-900/40">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("kirish.nameLabel")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("kirish.namePlaceholder")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={grade ?? ""}
          onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">{t("grade")}</option>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>
              {t("grade")} {g}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">{t("kirish.optional")}</p>
      </div>

      <button
        onClick={start}
        className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        {t("kirish.cta")} →
      </button>
    </div>
  );
}
