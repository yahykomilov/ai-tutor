import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const FEATURES = [
  { icon: "🌐", titleKey: "landing.f1.title", descKey: "landing.f1.desc" },
  { icon: "🛡️", titleKey: "landing.f2.title", descKey: "landing.f2.desc" },
  { icon: "🧠", titleKey: "landing.f3.title", descKey: "landing.f3.desc" },
] as const;

export default function Landing({ onStart, topControls }: { onStart: () => void; topControls: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-full items-center justify-center bg-surface px-4 py-10 dark:bg-ink-950">
      <div className="absolute right-4 top-4">{topControls}</div>
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white/70 p-10 text-center shadow-sm dark:border-ink-700 dark:bg-ink-900/60">
        <img src="/logo.png" alt="AI Tutor" className="mx-auto h-16 w-16 rounded-2xl shadow-sm" />
        <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink-900 dark:text-white">
          {t("landing.title1")}
          <br />
          {t("landing.title2")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("landing.subtitle")}
        </p>
        <button
          onClick={onStart}
          className="mt-6 rounded-full bg-brand-500 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t("landing.cta")}
        </button>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-ink-900">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-base text-white dark:bg-brand-600">
                {f.icon}
              </div>
              <div className="text-sm font-bold text-ink-900 dark:text-white">{t(f.titleKey)}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
