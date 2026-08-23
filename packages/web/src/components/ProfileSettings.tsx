import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuthUser } from "../useAuth.js";

export default function ProfileSettings({
  user,
  onSave,
  onLogout,
  onClose,
}: {
  user: AuthUser;
  onSave: (patch: { name: string; grade?: number }) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [grade, setGrade] = useState<number | undefined>(user.grade);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink-900 dark:text-white">{user.name}</div>
            <div className="truncate text-xs text-slate-400">{user.email}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("register.nameLabel")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("register.gradeLabel")}</label>
            <select
              value={grade ?? ""}
              onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t("grade")}</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {t("grade")} {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            onSave({ name: name.trim() || user.name, grade });
            onClose();
          }}
          className="mt-5 w-full rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {t("common.save")}
        </button>
        <button
          onClick={onLogout}
          className="mt-2 w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-white/5"
        >
          {t("common.logout")}
        </button>
      </div>
    </div>
  );
}
