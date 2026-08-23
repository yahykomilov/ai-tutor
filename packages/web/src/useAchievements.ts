import { useCallback, useState } from "react";

/**
 * Лёгкая геймификация для виральности: сколько тем разобрано + streak по дням.
 * Хранится в localStorage — без бэкенда, на демо не падает.
 */
export interface Achievements {
  solved: number;
  streak: number;
  lastDay: string;
}

const KEY = "ai-tutor-achievements";
const empty = (): Achievements => ({ solved: 0, streak: 0, lastDay: "" });

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function load(): Achievements {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Achievements;
    return { solved: p.solved ?? 0, streak: p.streak ?? 0, lastDay: p.lastDay ?? "" };
  } catch {
    return empty();
  }
}

export function useAchievements() {
  const [ach, setAch] = useState<Achievements>(load);

  const bump = useCallback(() => {
    setAch((prev) => {
      const now = new Date();
      const today = dayStr(now);
      const yesterday = dayStr(new Date(now.getTime() - 86400000));
      let streak = prev.streak;
      if (prev.lastDay !== today) {
        streak = prev.lastDay === yesterday ? prev.streak + 1 : 1;
      }
      const next: Achievements = { solved: prev.solved + 1, streak: Math.max(streak, 1), lastDay: today };
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
