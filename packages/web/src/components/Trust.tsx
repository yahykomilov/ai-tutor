import { useTranslation } from "react-i18next";

export default function Trust({ onSeeSecurity }: { onSeeSecurity: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">{t("trust.title")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("trust.subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3">
        {(["trust.point1", "trust.point2", "trust.point3"] as const).map((k) => (
          <div
            key={k}
            className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>🛡️</span>
            <span>{t(k)}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onSeeSecurity}
        className="self-start rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        {t("trust.cta")} →
      </button>
    </div>
  );
}
