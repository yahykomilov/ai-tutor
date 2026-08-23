import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Lang } from "@ai-tutor/common";
import { supabase, hasSupabase, googleAuthReady } from "./lib/supabase.js";
import { loadProfile, saveProfile, DEFAULT_PROFILE, type Profile, type Theme } from "./store.js";

export interface AppUser {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
}

interface AuthResult {
  error?: string;
}

interface AppContextValue {
  user: AppUser | null;
  ready: boolean;
  profile: Profile;
  hasSupabase: boolean;
  googleAuthReady: boolean;
  signInGoogle: () => Promise<AuthResult>;
  signInEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpEmail: (email: string, password: string, name: string) => Promise<AuthResult>;
  continueAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const GUEST_KEY = "ai-tutor:guest";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  // загрузка профиля при смене пользователя + применение темы
  useEffect(() => {
    if (!user) return;
    const p = loadProfile(user.id);
    if (!p.name && user.name) p.name = user.name;
    setProfile(p);
    applyTheme(p.theme);
  }, [user]);

  // системная тема: реагируем на смену, если выбран "system"
  useEffect(() => {
    if (profile.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [profile.theme]);

  // инициализация сессии
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const u = data.session.user;
          setUser({ id: u.id, email: u.email ?? undefined, name: (u.user_metadata?.name as string) || u.email?.split("@")[0] || "User", isGuest: false });
        } else {
          restoreGuest();
        }
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
          if (session?.user) {
            const u = session.user;
            setUser({ id: u.id, email: u.email ?? undefined, name: (u.user_metadata?.name as string) || u.email?.split("@")[0] || "User", isGuest: false });
          }
        });
        unsub = () => sub.subscription.unsubscribe();
      } else {
        restoreGuest();
      }
      setReady(true);
    })();
    return () => unsub?.();
  }, []);

  function restoreGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      if (raw) setUser(JSON.parse(raw) as AppUser);
    } catch {
      /* ignore */
    }
  }

  const continueAsGuest = useCallback((name?: string) => {
    let g: AppUser;
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      g = raw ? (JSON.parse(raw) as AppUser) : { id: "guest-" + Math.random().toString(36).slice(2), name: name || "Mehmon", isGuest: true };
      if (name) g.name = name;
    } catch {
      g = { id: "guest-" + Math.random().toString(36).slice(2), name: name || "Mehmon", isGuest: true };
    }
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(g));
    } catch {
      /* ignore */
    }
    setUser(g);
  }, []);

  const signInGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { error: "supabase-not-configured" };
    // signInWithOAuth редиректит на Supabase ДО того, как ошибку можно поймать здесь —
    // если провайдер не включён в дашборде, ученик увидит голую JSON-страницу.
    // googleAuthReady не даёт стартовать редирект, пока это не подтверждено вручную.
    if (!googleAuthReady) return { error: "google-provider-not-ready" };
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    return error ? { error: error.message } : {};
  }, []);

  const signInEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "supabase-not-configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    if (!supabase) return { error: "supabase-not-configured" };
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      localStorage.removeItem(GUEST_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        if (user) saveProfile(user.id, next);
        if (patch.theme) applyTheme(patch.theme);
        return next;
      });
    },
    [user],
  );

  const value: AppContextValue = {
    user,
    ready,
    profile,
    hasSupabase,
    googleAuthReady,
    signInGoogle,
    signInEmail,
    signUpEmail,
    continueAsGuest,
    signOut,
    updateProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { Profile, Theme, Lang };
