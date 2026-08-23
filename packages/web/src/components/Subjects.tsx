import { useTranslation } from "react-i18next";
import { SUBJECTS, type Lang } from "@ai-tutor/common";

export default function Subjects({ lang, onPick }: { lang: Lang; onPick: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">{t("subjects.title")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subjects.subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-sm font-semibold text-ink-900 dark:text-white">{s.label[lang]}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("subjects.cardHint")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
