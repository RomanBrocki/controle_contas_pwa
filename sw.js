// sw.js - service worker do Controle de Contas PWA

const APP_VERSION = "2026-03-11-1";
const CACHE_NAME = `contas-pwa-${APP_VERSION}`;

const URLS_TO_CACHE = [
  "./",
  "./index.html",
  `./manifest.json?v=${APP_VERSION}`,
  "./src/data-adapter.js",
  "./src/router.js",
  "./src/supabase/client.js",
  "./src/supabase/queries.js",
  "./src/features/charts.js",
  "./src/features/pdf.js",
  "./src/components/App.jsx",
  "./src/components/LoginGate.jsx",
  "./src/components/SelectPopoverField.jsx",
  "./src/components/PostLoginMock.jsx",
  "./src/components/ContaCard.jsx",
  "./src/components/EditPopup.jsx",
  "./src/components/SettingsModal.jsx",
  "./src/components/ReportsModal.jsx",
  "./src/components/StyleTag.jsx",
  "./src/dashboard/DashboardView.jsx"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(URLS_TO_CACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    event.request.mode === "navigate" ||
    event.request.destination === "document";

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse =
        await cache.match(event.request) ||
        await cache.match("./") ||
        await cache.match("./index.html");

      if (cachedResponse) {
        return cachedResponse;
      }

      if (isNavigation) {
        return cache.match("./index.html");
      }

      throw error;
    }
  })());
});
