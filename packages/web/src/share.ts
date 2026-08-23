/** Виральный шэр: нативный Web Share на телефоне, иначе — копирование в буфер. */
export type ShareResult = "shared" | "copied" | "cancelled";

export async function shareContent(opts: { title: string; text: string; url?: string }): Promise<ShareResult> {
  const url = opts.url ?? window.location.origin;
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (typeof nav.share === "function") {
    try {
      await nav.share({ title: opts.title, text: opts.text, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${opts.text}\n${url}`);
    return "copied";
  } catch {
    return "cancelled";
  }
}
