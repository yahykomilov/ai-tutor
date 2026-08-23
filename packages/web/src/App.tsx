import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lang } from "@ai-tutor/common";
import Onboarding from "./components/Onboarding.js";
import Chat from "./components/Chat.js";
import Subjects from "./components/Subjects.js";
import Profile from "./components/Profile.js";
import Trust from "./components/Trust.js";
import SecurityDemo from "./components/SecurityDemo.js";
import AdminPanel from "./components/AdminPanel.js";

const LANG_BTNS: { id: Lang; label: string }[] = [
  { id: "uz", label: "UZ" },
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

type Tab = "kirish" | "chat" | "subjects" | "profile" | "trust" | "security" | "admin";

const TABS: { id: Tab; icon: string; key: string }[] = [
  { id: "kirish", icon: "🏠", key: "nav.kirish" },
  { id: "chat", icon: "💬", key: "nav.chat" },
  { id: "subjects", icon: "📚", key: "nav.subjects" },
  { id: "profile", icon: "🏆", key: "nav.profile" },
  { id: "trust", icon: "🎓", key: "nav.trust" },
  { id: "security", icon: "🛡", key: "nav.security" },
  { id: "admin", icon: "📊", key: "nav.admin" },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("kirish");
  const [pendingSubject, setPendingSubject] = useState<string | undefined>();
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
            <img src="/logo.png" alt="AI Tutor" className="h-9 w-9 rounded-lg" />
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
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === tb.id
                  ? "border-brand-600 text-brand-700 dark:text-brand-300"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tb.icon} {t(tb.key)}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {tab === "kirish" && <Onboarding onStart={() => setTab("chat")} />}
        {tab === "chat" && <Chat lang={lang} initialSubject={pendingSubject} />}
        {tab === "subjects" && (
          <Subjects
            lang={lang}
            onPick={(id) => {
              setPendingSubject(id);
              setTab("chat");
            }}
          />
        )}
        {tab === "profile" && <Profile />}
        {tab === "trust" && <Trust onSeeSecurity={() => setTab("security")} />}
        {tab === "security" && <SecurityDemo lang={lang} />}
        {tab === "admin" && <AdminPanel lang={lang} />}
      </main>
    </div>
  );
}
