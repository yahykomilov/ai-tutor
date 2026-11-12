import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUBJECTS, type AdminStats, type Lang } from "@ai-tutor/common";
import { fetchAdminStats } from "../api.js";

const POLL_MS = 8000;

export default function AdminPanel({ lang }: { lang: Lang }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await fetchAdminStats();
      if (cancelled) return;
      setStats(s);
      setUnreachable(s === null);
      setLoading(false);
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const subjectLabel = (id: string) => SUBJECTS.find((s) => s.id === id)?.label[lang] ?? id;
  const subjectEmoji = (id: string) => SUBJECTS.find((s) => s.id === id)?.emoji ?? "";
  const maxUsage = Math.max(1, ...(stats?.subjectUsage.map((s) => s.count) ?? [1]));

  const STATS_TILES = stats
    ? [
        { key: "activeStudents", value: String(stats.activeStudents) },
        { key: "questionsToday", value: String(stats.questionsToday) },
        { key: "blockedToday", value: String(stats.blockedToday) },
        {
          key: "topSubject",
          value: stats.topSubject ? `${subjectEmoji(stats.topSubject)} ${subjectLabel(stats.topSubject)}` : "—",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">📊 {t("admin.title")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("admin.subtitle")}</p>
      </div>

      {loading && <p className="text-sm text-slate-400">{t("admin.loading")}</p>}

      {unreachable && !loading && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          ⚠️ {t("admin.unreachable")}
        </p>
      )}

      {stats && (
        <>
          {/* stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS_TILES.map((s) => (
              <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-ink-900">
                <div className="text-2xl font-extrabold tabular-nums text-ink-900 dark:text-white">{s.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t(`admin.stat.${s.key}`)}</div>
              </div>
            ))}
          </div>

          {/* subject usage — horizontal bar, single hue (magnitude, not identity) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-ink-900">
            <div className="mb-3 text-sm font-bold text-ink-900 dark:text-white">{t("admin.usageTitle")}</div>
            {stats.subjectUsage.length === 0 ? (
              <p className="text-xs text-slate-400">{t("admin.emptyUsage")}</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.subjectUsage.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-xs text-slate-600 dark:text-slate-300">
                      {subjectEmoji(s.id)} {subjectLabel(s.id)}
                    </div>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500 dark:bg-brand-400" style={{ width: `${(s.count / maxUsage) * 100}%` }} />
                    </div>
                    <div className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {s.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* security log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-ink-900">
            <div className="mb-3 text-sm font-bold text-ink-900 dark:text-white">🛡 {t("admin.logTitle")}</div>
            {stats.securityLog.length === 0 ? (
              <p className="text-xs text-slate-400">{t("admin.emptyLog")}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {stats.securityLog.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 dark:border-rose-900/50 dark:bg-rose-950/20"
                  >
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{r.time}</span>
                    <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      {t("sec.layer")} {r.layer}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {r.lang}
                    </span>
                    <code className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{r.text}</code>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400">{t("admin.liveNote")}</p>
        </>
      )}
    </div>
  );
}
