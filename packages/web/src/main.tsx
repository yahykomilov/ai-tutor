import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";
import "./i18n.js";
import { initTelegram } from "./telegram.js";

const tgScheme = initTelegram();
if (tgScheme === "dark") document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
