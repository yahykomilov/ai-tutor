import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * "Sign in with Google" tugmasi (Google Identity Services). VITE_GOOGLE_CLIENT_ID
 * sozlanmagan bo'lsa hech narsa render qilmaydi — sayt Guest rejimda ishlayveradi.
 */
export default function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;

    function render() {
      if (cancelled || !window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId as string,
        callback: (resp) => onCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 300 });
    }

    if (window.google) {
      render();
      return;
    }
    const id = setInterval(() => {
      if (window.google) {
        render();
        clearInterval(id);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [clientId, onCredential]);

  if (!clientId) return null;
  return <div ref={ref} className="flex justify-center" />;
}
