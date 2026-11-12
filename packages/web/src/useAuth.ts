import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@ai-tutor/common";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  grade?: number;
  lang?: Lang;
}

const TOKEN_KEY = "ai-tutor-token";
const API = (import.meta.env.VITE_API_URL as string | undefined) || "";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { headers: { authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("session expired");
        const u = (await res.json()) as AuthUser;
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          setToken(null);
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const res = await fetch(`${API}/api/auth/google`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("google auth failed");
    const data = (await res.json()) as { token: string; user: AuthUser };
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      /* ignore */
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<AuthUser, "name" | "grade" | "lang">>) => {
      if (!token) return;
      const res = await fetch(`${API}/api/me`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (res.ok) setUser((await res.json()) as AuthUser);
    },
    [token],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, loading, loginWithGoogleIdToken, updateProfile, logout };
}
