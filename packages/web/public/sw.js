// Минимальный service worker: делает сайт устанавливаемым (PWA) и даёт
// офлайн-оболочку. Контент — network-first (свежий), с фолбэком на кэш.
const CACHE = "ai-tutor-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/index.html", "/manifest.webmanifest", "/icon.svg"])));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/index.html")));
  }
});
