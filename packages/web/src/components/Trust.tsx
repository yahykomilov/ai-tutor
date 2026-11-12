import { useTranslation } from "react-i18next";

const CARDS = [
  { icon: "🎓", titleKey: "trust.c1.title", descKey: "trust.c1.desc" },
  { icon: "🛡️", titleKey: "trust.c2.title", descKey: "trust.c2.desc" },
  { icon: "📖", titleKey: "trust.c3.title", descKey: "trust.c3.desc" },
] as const;

export default function Trust({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="self-start text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        ← {t("nav.security")}
      </button>

      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink-900 dark:text-white">{t("trust.title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t("trust.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.titleKey} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-ink-900">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-base dark:bg-slate-800">
              {c.icon}
            </span>
            <div className="text-sm font-bold text-ink-900 dark:text-white">{t(c.titleKey)}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t(c.descKey)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 rounded-2xl bg-ink-900 p-8 dark:bg-ink-950 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="text-lg font-bold text-white">{t("trust.howTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("trust.howDesc")}</p>
          <button
            onClick={onBack}
            className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600"
          >
            {t("trust.cta")}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-6 text-center">
          <span className="text-4xl">🧑‍🏫🤖</span>
          <span className="text-xs font-semibold text-slate-300">{t("trust.illustration")}</span>
        </div>
      </div>
    </div>
  );
}
