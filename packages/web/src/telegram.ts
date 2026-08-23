/** Тонкая обёртка над Telegram WebApp API (для Mini App). */
interface TgWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  initData?: string;
  themeParams?: Record<string, string>;
}

const tg: TgWebApp | undefined = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;

export const isTelegram = Boolean(tg?.initData);

export function initTelegram(): "light" | "dark" | null {
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
  } catch {
    /* noop */
  }
  return tg.colorScheme ?? null;
}
