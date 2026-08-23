import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lang } from "@ai-tutor/common";
import Chat from "./components/Chat.js";
import SecurityDemo from "./components/SecurityDemo.js";

const LANG_BTNS: { id: Lang; label: string }[] = [
  { id: "uz", label: "UZ" },
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"chat" | "security">("chat");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const lang = i18n.language as Lang;

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 to-white text-slate-800 dark:from-ink-900 dark:to-ink-800 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-ink-700 dark:bg-ink-900/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <div>
              <div className="text-lg font-extrabold leading-none">{t("appName")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("tagline")}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {LANG_BTNS.map((l) => (
              <button
                key={l.id}
                onClick={() => i18n.changeLanguage(l.id)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                  lang === l.id
                    ? "bg-brand-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={toggleDark}
              className="ml-1 rounded-md px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-4">
          {(["chat", "security"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === id
                  ? "border-brand-600 text-brand-700 dark:text-brand-300"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {id === "chat" ? `💬 ${t("nav.chat")}` : `🛡 ${t("nav.security")}`}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {tab === "chat" ? <Chat lang={lang} /> : <SecurityDemo lang={lang} />}
      </main>
    </div>
  );
}
