import { useTranslation } from "react-i18next";
import type { Conversation } from "../store.js";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <button
        onClick={onNew}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700"
      >
        ＋ {t("chat.new")}
      </button>

      <div className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("chat.history")}</div>

      <div className="chat-scroll flex-1 space-y-1 overflow-y-auto">
        {conversations.length === 0 && <div className="px-2 py-4 text-center text-xs text-slate-400">{t("chat.noHistory")}</div>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition ${
              c.id === activeId ? "bg-brand-100 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <button onClick={() => onSelect(c.id)} className="flex-1 truncate text-left">
              💬 {c.title}
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              title={t("chat.delete")}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
