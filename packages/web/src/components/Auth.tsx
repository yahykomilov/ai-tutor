import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context.js";
import type { Lang } from "@ai-tutor/common";

const LANGS: { id: Lang; label: string }[] = [
  { id: "uz", label: "O'zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
];

export default function Auth() {
  const { t, i18n } = useTranslation();
  const { signInGoogle, signInEmail, signUpEmail, continueAsGuest, hasSupabase, googleAuthReady } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const notConfigured = () => setErr(t("auth.soon"));

  async function google() {
    setErr("");
    // hasSupabase=false → нет бэкенда вовсе; googleAuthReady=false → провайдер ещё не
    // включён в Supabase Dashboard. Оба случая — без редиректа, дружелюбный текст.
    if (!hasSupabase || !googleAuthReady) return notConfigured();
    setBusy(true);
    const r = await signInGoogle();
    if (r.error) {
      // Сырую ошибку Supabase (например "provider is not enabled") ученику не показываем —
      // тот же дружелюбный текст, что и при полном отсутствии Supabase.
      console.error("[auth] google sign-in failed:", r.error);
      notConfigured();
    }
    setBusy(false);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!hasSupabase) {
      // локальный режим: заводим гостя с введённым именем/почтой
      continueAsGuest(name || email.split("@")[0] || undefined);
      return;
    }
    setBusy(true);
    const r = mode === "signup" ? await signUpEmail(email, password, name) : await signInEmail(email, password);
    if (r.error) setErr(r.error);
    setBusy(false);
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-10">
      {/* атмосферный фон: тёплый меш терракот + teal */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-100 via-white to-ink-100 dark:from-ink-900 dark:via-ink-950 dark:to-slate-950" />
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-700/30" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 -z-10 h-96 w-96 rounded-full bg-ink-700/30 blur-3xl dark:bg-ink-800/40" />

      <div className="w-full max-w-md animate-fade-up">
        {/* лог-переключатель языка */}
        <div className="mb-6 flex justify-center gap-1">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => i18n.changeLanguage(l.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i18n.language === l.id ? "bg-brand-600 text-white shadow" : "bg-white/60 text-slate-600 hover:bg-white dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl shadow-brand-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-ink-800 text-3xl shadow-lg">🎓</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("appName")}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("auth.subtitle")}</p>
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-md disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {t("auth.google")}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> {t("auth.or")} <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={submitEmail} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.name")}
                autoComplete="name"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-base outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 sm:text-sm"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-base outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 sm:text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-base outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 sm:text-sm"
            />
            {err && <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>}
            <button type="submit" disabled={busy} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50">
              {mode === "signup" ? t("auth.signup") : t("auth.signin")}
            </button>
          </form>

          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="mt-3 w-full text-center text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
            {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}
          </button>

          <div className="my-4 h-px bg-slate-200 dark:bg-slate-700" />

          <button onClick={() => continueAsGuest(name || undefined)} className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            👤 {t("auth.guest")}
          </button>
        </div>
      </div>
    </div>
  );
}
