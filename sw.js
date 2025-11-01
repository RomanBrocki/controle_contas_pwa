// sw.js - service worker básico para o Controle de Contas PWA

const CACHE_NAME = "contas-pwa-v9";

// ⚠️ Coloque aqui só o que está NO SEU DOMÍNIO (GitHub Pages).

// Os scripts de CDN (react, tailwind, supabase) serão carregados da internet normalmente.
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/data-adapter.js",
  "./src/router.js",
  "./src/supabase/client.js",
  "./src/supabase/queries.js",
  "./src/features/charts.js",
  "./src/features/pdf.js",
  "./src/components/App.jsx",
  "./src/components/LoginGate.jsx",
  "./src/components/PostLoginMock.jsx",
  "./src/components/ContaCard.jsx",
  "./src/components/EditPopup.jsx",
  "./src/components/SettingsModal.jsx",
  "./src/components/ReportsModal.jsx",
  "./src/components/StyleTag.jsx"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  // estratégia: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return (
        resp ||
        fetch(event.request).catch(() => {
          // aqui você pode devolver uma página offline.html se quiser
        })
      );
    })
  );
});
