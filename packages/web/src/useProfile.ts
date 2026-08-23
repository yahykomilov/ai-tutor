import { useCallback, useState } from "react";

/**
 * Лёгкая персонализация без бэкенда: имя + класс в localStorage.
 * `registered` — прошёл ли пользователь экран регистрации (или нажал "пропустить"),
 * используется только для навигации (landing → app), это не аутентификация.
 */
export interface Profile {
  name: string;
  grade?: number;
  registered: boolean;
}

const KEY = "ai-tutor-profile";
const empty = (): Profile => ({ name: "", grade: undefined, registered: false });

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Profile>;
    return { name: p.name ?? "", grade: p.grade, registered: p.registered ?? false };
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
