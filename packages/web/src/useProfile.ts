import { useCallback, useState } from "react";

/**
 * Лёгкая персонализация без бэкенда: имя + класс в localStorage.
 * Не аутентификация — просто заполняется/пропускается на Kirish, ничего не блокирует.
 */
export interface Profile {
  name: string;
  grade?: number;
}

const KEY = "ai-tutor-profile";
const empty = (): Profile => ({ name: "", grade: undefined });

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Profile;
    return { name: p.name ?? "", grade: p.grade };
  } catch {
    return empty();
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(load);

  const setProfile = useCallback((next: Profile) => {
    setProfileState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return { profile, setProfile };
}
