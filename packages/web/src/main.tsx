import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { AppProvider } from "./context.js";
import "./index.css";
import "./i18n.js";
import { initTelegram } from "./telegram.js";

initTelegram();

// PWA: service worker, чтобы сайт ставился на телефон как приложение.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* не критично */
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
