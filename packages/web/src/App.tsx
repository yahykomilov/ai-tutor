import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lang } from "@ai-tutor/common";
import { useProfile } from "./useProfile.js";
import Landing from "./components/Landing.js";
import Register from "./components/Register.js";
import Sidebar from "./components/Sidebar.js";
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

export type View = "landing" | "register" | "chat" | "security" | "subjects" | "profile" | "trust" | "admin";
export const SHELL_VIEWS: View[] = ["chat", "security", "subjects", "profile"];

export default function App() {
  const { t, i18n } = useTranslation();
  const { profile, setProfile } = useProfile();
  const [view, setView] = useState<View>(profile.registered ? "chat" : "landing");
  const [pendingSubject, setPendingSubject] = useState<string | undefined>();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const lang = i18n.language as Lang;
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const goApp = () => setView(profile.registered ? "chat" : "register");

  const topControls = (
    <div className="flex items-center gap-1">
      {LANG_BTNS.map((l) => (
        <button
          key={l.id}
          onClick={() => i18n.changeLanguage(l.id)}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
            lang === l.id ? "bg-ink-900 text-white dark:bg-brand-500" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
  );

  if (view === "landing") {
    return <Landing onStart={goApp} topControls={topControls} />;
  }

  if (view === "register") {
    return (
      <Register
        profile={profile}
        onSubmit={(p) => {
          setProfile({ ...p, registered: true });
          setView("chat");
        }}
        onSkip={() => {
          setProfile({ ...profile, registered: true });
          setView("chat");
        }}
        topControls={topControls}
      />
    );
  }

  if (view === "trust") {
    return (
      <div className="min-h-full bg-surface text-ink-900 dark:bg-ink-950 dark:text-slate-100">
        <main className="mx-auto max-w-4xl px-6 py-10">
          <Trust onBack={() => setView("security")} />
        </main>
      </div>
    );
  }

  const shellView = SHELL_VIEWS.includes(view) ? view : "chat";

  return (
    <div className="flex min-h-full bg-surface text-ink-900 dark:bg-ink-950 dark:text-slate-100">
      <Sidebar
        current={shellView}
        onNavigate={(v) => setView(v)}
        onQuickStart={() => setView("chat")}
      />
      <div className="flex-1">
        <div className="flex justify-end gap-2 border-b border-slate-200/60 px-6 py-3 dark:border-ink-700">{topControls}</div>
        <main className="mx-auto max-w-5xl px-6 py-6">
          {shellView === "chat" && <Chat lang={lang} initialSubject={pendingSubject} />}
          {shellView === "subjects" && (
            <Subjects
              lang={lang}
              onPick={(id) => {
                setPendingSubject(id);
                setView("chat");
              }}
            />
          )}
          {shellView === "profile" && <Profile lang={lang} />}
          {shellView === "security" && <SecurityDemo lang={lang} onSeeTrust={() => setView("trust")} />}
        </main>
        <button
          onClick={() => setView("admin")}
          className="fixed bottom-3 right-3 rounded-full bg-ink-900/80 px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white dark:bg-white/10"
          title="Admin"
        >
          📊
        </button>
        {view === "admin" && (
          <div className="fixed inset-0 z-20 overflow-y-auto bg-surface p-6 dark:bg-ink-950">
            <div className="mx-auto max-w-5xl">
              <button
                onClick={() => setView("chat")}
                className="mb-4 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                ← {t("common.back")}
              </button>
              <AdminPanel lang={lang} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
