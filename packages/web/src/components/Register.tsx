import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Profile } from "../useProfile.js";
import GoogleSignInButton from "./GoogleSignInButton.js";

export default function Register({
  profile,
  onSubmit,
  onSkip,
  onGoogleCredential,
  error,
  topControls,
}: {
  profile: Profile;
  onSubmit: (p: Profile) => void;
  onSkip: () => void;
  onGoogleCredential: (idToken: string) => void;
  error?: string;
  topControls: ReactNode;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<number | undefined>(profile.grade);

  function submit() {
    onSubmit({ name: name.trim(), grade, registered: true });
  }

  return (
    <div className="relative flex min-h-full items-center justify-center bg-surface px-4 py-10 dark:bg-ink-950">
      <div className="absolute right-4 top-4">{topControls}</div>
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900">
        <img src="/logo.png" alt="AI Tutor" className="mx-auto h-14 w-14 rounded-2xl shadow-sm" />
        <h1 className="mt-4 text-center text-xl font-extrabold text-ink-900 dark:text-white">
          {profile.name ? t("register.welcomeBack", { name: profile.name }) : t("register.title")}
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-500 dark:text-slate-400">{t("register.subtitle")}</p>

        <div className="mt-6">
          <GoogleSignInButton onCredential={onGoogleCredential} />
          {error && <p className="mt-2 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          {t("register.or")}
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="flex flex-col gap-3 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("register.nameLabel")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("register.namePlaceholder")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("register.gradeLabel")}</label>
            <select
              value={grade ?? ""}
              onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t("grade")}</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {t("grade")} {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!name.trim()}
          className="mt-6 w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-40"
        >
          {t("register.submit")} →
        </button>
        <button
          onClick={onSkip}
          className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {t("register.skip")}
        </button>
      </div>
    </div>
  );
}
