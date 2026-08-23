import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase включается, только если заданы env. Иначе приложение работает
// в локальном (гостевом) режиме — аккаунт и чаты хранятся в браузере.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const hasSupabase = Boolean(supabase);
