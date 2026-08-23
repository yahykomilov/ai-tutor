import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "./context.js";
import { loadConversations, saveConversations, newId, titleFrom, type Conversation, type StoredMsg } from "./store.js";
import Auth from "./components/Auth.js";
import Chat from "./components/Chat.js";
import SecurityDemo from "./components/SecurityDemo.js";
import Sidebar from "./components/Sidebar.js";
import Settings from "./components/Settings.js";

export default function App() {
  const { t } = useTranslation();
  const { user, ready, profile } = useApp();
  const [tab, setTab] = useState<"chat" | "security">("chat");
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setConvos([]);
      setActiveId(null);
      return;
    }
    setConvos(loadConversations(user.id));
    setActiveId(null);
  }, [user]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-brand-50 dark:bg-ink-900">
        <div className="animate-blink text-4xl">🎓</div>
      </div>
    );
  }
  if (!user) return <Auth />;

  const active = convos.find((c) => c.id === activeId) ?? null;

  function persist(list: Conversation[]) {
    setConvos(list);
    if (user) saveConversations(user.id, list);
  }

  function handlePersist(messages: StoredMsg[], subject?: string, grade?: number) {
    if (activeId) {
      persist(convos.map((c) => (c.id === activeId ? { ...c, messages, subject, grade, updatedAt: Date.now() } : c)));
    } else {
      const id = newId();
      persist([{ id, title: titleFrom(messages[0]?.content ?? ""), subject, grade, messages, updatedAt: Date.now() }, ...convos]);
      setActiveId(id);
    }
  }

  const newChat = () => {
    setActiveId(null);
    setSidebarOpen(false);
  };
  const selectChat = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  };
  const deleteChat = (id: string) => {
    persist(convos.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-brand-50 to-white text-slate-800 dark:from-ink-900 dark:to-ink-950 dark:text-slate-100">
      {/* шапка */}
      <header className="z-20 flex items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 py-2.5 backdrop-blur dark:border-ink-700 dark:bg-ink-900/70">
        <div className="flex items-center gap-2">
          {tab === "chat" && (
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden">☰</button>
          )}
          <span className="text-xl">🎓</span>
          <span className="font-display text-lg font-semibold leading-none">{t("appName")}</span>
        </div>

        <div className="flex gap-1">
          {(["chat", "security"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === id ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {id === "chat" ? `💬 ${t("nav.chat")}` : `🛡 ${t("nav.security")}`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm font-semibold transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-ink-800 text-xs text-white">
            {(profile.name || user.name || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden max-w-[8rem] truncate sm:inline">{profile.name || user.name}</span>
        </button>
      </header>

      {/* тело */}
      <div className="flex min-h-0 flex-1">
        {tab === "chat" && (
          <>
            {/* сайдбар desktop */}
            <aside className="hidden w-64 shrink-0 border-r border-slate-200/60 bg-white/40 dark:border-ink-700 dark:bg-ink-900/40 md:block">
              <Sidebar conversations={convos} activeId={activeId} onSelect={selectChat} onNew={newChat} onDelete={deleteChat} />
            </aside>
            {/* сайдбар mobile drawer */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)}>
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                <aside className="absolute left-0 top-0 h-full w-72 animate-fade-up bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                  <Sidebar conversations={convos} activeId={activeId} onSelect={selectChat} onNew={newChat} onDelete={deleteChat} />
                </aside>
              </div>
            )}
          </>
        )}

        <main className="min-w-0 flex-1 overflow-hidden">
          {tab === "chat" ? (
            <Chat key={activeId ?? "new"} conversation={active} profile={profile} onPersist={handlePersist} />
          ) : (
            <div className="mx-auto h-full max-w-3xl overflow-y-auto px-4 py-4">
              <SecurityDemo lang={profile.lang} />
            </div>
          )}
        </main>
      </div>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
