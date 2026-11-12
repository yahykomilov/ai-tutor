import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "ai-tutor-theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

function loadMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

const ORDER: ThemeMode[] = ["light", "dark", "system"];

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(loadMode);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const cycle = useCallback(() => {
    setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
  }, [mode, setMode]);

  return { mode, setMode, cycle };
}
