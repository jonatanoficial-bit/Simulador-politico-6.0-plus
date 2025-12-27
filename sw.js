/* sw.js — ARQUIVO COMPLETO (versão resiliente)
   Objetivos:
   - Evitar "tela preta" por cache preso
   - Não quebrar instalação se algum arquivo (ex: DLC) não existir ainda
   - Atualizar mais fácil (cache versionado)
*/

const CACHE_VERSION = "v3"; // <- aumente para v4, v5... quando quiser forçar atualização total
const CACHE_NAME = `simpoll-cache-${CACHE_VERSION}`;

// Lista de arquivos essenciais (core)
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
  "/src/ui/app.js",

  // DLC system (opcional — se não existir, não quebra)
  "/dlc/manifest.js",
  "/dlc/loader.js",
  "/dlc/packs/exemplo_pack.js"
];

// Helper: cacheia sem falhar se algum arquivo estiver faltando
async function safeCacheAddAll(cache, assets) {
  const results = await Promise.allSettled(
    assets.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res || !res.ok) throw new Error(`HTTP ${res?.status} em ${url}`);
        await cache.put(url, res);
        return true;
      } catch (e) {
        // não falha a instalação por causa de um arquivo opcional
        return false;
      }
    })
  );
  return results;
}

// Permite forçar atualização (pelo app.js, se quiser usar depois)
self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install: cacheia o core (sem quebrar se faltar DLC)
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await safeCacheAddAll(cache, CORE_ASSETS);
    self.skipWaiting();
  })());
});

// Activate: remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// Fetch strategy:
// - HTML/navegação: network-first com fallback cache
// - JS/CSS/IMG/etc: stale-while-revalidate (retorna cache rápido e atualiza em background)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // só mesma origem
  if (url.origin !== self.location.origin) return;

  // Navegação (HTML)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const cache = await caches.open(CACHE_NAME);
        cache.put("/", fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req) || await caches.match("/") || await caches.match("/index.html");
        return cached || new Response("Offline", {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  // Assets (stale-while-revalidate)
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const fetchPromise = (async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        if (fresh && fresh.ok && req.method === "GET") {
          await cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        return null;
      }
    })();

    // devolve cache rápido; se não houver, espera a rede
    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});