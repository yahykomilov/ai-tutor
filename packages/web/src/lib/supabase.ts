import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase включается, только если заданы env. Иначе приложение работает
// в локальном (гостевом) режиме — аккаунт и чаты хранятся в браузере.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const hasSupabase = Boolean(supabase);

// Google OAuth требует отдельного ручного шага (Client ID/Secret в Google Cloud +
// включить провайдер в Supabase Dashboard) — supabase.auth.signInWithOAuth() делает
// редирект на Supabase ДО того, как можно поймать ошибку, поэтому пока провайдер
// не включён, редирект прилетает на голую JSON-страницу с ошибкой. Флаг не даёт
// кнопке инициировать редирект, пока это не подтверждено вручную.
export const googleAuthReady = import.meta.env.VITE_GOOGLE_AUTH_READY === "true";
