import { useCallback, useState } from "react";

/**
 * Лёгкая геймификация для виральности: сколько тем разобрано + streak по дням +
 * короткая история последних предметов (для ленты "Yaqinda o'rganilgan mavzular" —
 * реальные записи, а не выдуманные демо-темы).
 * Хранится в localStorage — без бэкенда, на демо не падает.
 */
export interface HistoryItem {
  subjectId?: string;
  day: string;
}

export interface Achievements {
  solved: number;
  streak: number;
  lastDay: string;
  history: HistoryItem[];
}

const KEY = "ai-tutor-achievements";
const empty = (): Achievements => ({ solved: 0, streak: 0, lastDay: "", history: [] });

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function load(): Achievements {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Achievements>;
    return { solved: p.solved ?? 0, streak: p.streak ?? 0, lastDay: p.lastDay ?? "", history: p.history ?? [] };
  } catch {
    return empty();
  }
}

export function useAchievements() {
  const [ach, setAch] = useState<Achievements>(load);

  const bump = useCallback((subjectId?: string) => {
    setAch((prev) => {
      const now = new Date();
      const today = dayStr(now);
      const yesterday = dayStr(new Date(now.getTime() - 86400000));
      let streak = prev.streak;
      if (prev.lastDay !== today) {
        streak = prev.lastDay === yesterday ? prev.streak + 1 : 1;
      }
      const history = [{ subjectId, day: today }, ...prev.history].slice(0, 8);
      const next: Achievements = { solved: prev.solved + 1, streak: Math.max(streak, 1), lastDay: today, history };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { ach, bump };
}
