import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";
import "./i18n.js";
import { initTelegram } from "./telegram.js";

const tgScheme = initTelegram();
if (tgScheme === "dark") document.documentElement.classList.add("dark");

// PWA: регистрируем service worker, чтобы сайт ставился на телефон как приложение.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* PWA — не критично, сайт работает и без SW */
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
