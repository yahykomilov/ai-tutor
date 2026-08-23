import { useTranslation } from "react-i18next";
import type { View } from "../App.js";
import { SHELL_VIEWS } from "../App.js";

const ITEMS: { id: (typeof SHELL_VIEWS)[number]; icon: string; key: string }[] = [
  { id: "chat", icon: "🎓", key: "nav.chat" },
  { id: "security", icon: "🛡️", key: "nav.security" },
  { id: "subjects", icon: "📖", key: "nav.subjects" },
  { id: "profile", icon: "📊", key: "nav.profile" },
];

export default function Sidebar({
  current,
  onNavigate,
  onQuickStart,
}: {
  current: View;
  onNavigate: (v: View) => void;
  onQuickStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white px-4 py-5 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center gap-2 px-2 pb-6">
        <img src="/logo.png" alt="AI Tutor" className="h-9 w-9 rounded-lg" />
        <div>
          <div className="text-base font-extrabold leading-none text-ink-900 dark:text-white">{t("appName")}</div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{t("tagline")}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => onNavigate(it.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
              current === it.id
                ? "bg-ink-900 text-white dark:bg-brand-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            }`}
          >
            <span className="text-base">{it.icon}</span>
            {t(it.key)}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <button
          onClick={onQuickStart}
          className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t("landing.cta")}
        </button>
      </div>
    </aside>
  );
}
