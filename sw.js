/* sw.js — cache offline básico (PWA)
   - Cache-first para arquivos do app
   - Atualização automática ao recarregar
*/

const CACHE_NAME = "simpoll-cache-v1";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/sw.js",

  "/src/data/data.js",
  "/src/core/models.js",
  "/src/core/save.js",
  "/src/core/sim.js",
  "/src/ui/app.js"
];

// Instala e pré-cacheia o core
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

// Ativa e remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    self.clients.claim();
  })());
});

// Estratégia:
// - Para navegação (HTML): network-first com fallback cache
// - Para assets (js/css/img): cache-first com fallback network
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só intercepta mesma origem
  if (url.origin !== self.location.origin) return;

  // Navegação / HTML
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/", fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req) || await caches.match("/");
        return cached || new Response("Offline", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  // Assets
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      // cacheia apenas GET ok
      if (req.method === "GET" && fresh && fresh.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      // fallback simples
      return cached || new Response("", { status: 504 });
    }
  })());
});