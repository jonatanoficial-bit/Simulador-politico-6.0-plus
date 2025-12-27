/* sw.js — MODO EMERGÊNCIA (sem cache)
   - apaga caches antigos
   - não cacheia nada
   - evita tela preta causada por SW preso
*/

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // apaga TUDO que estiver em cache (de versões antigas)
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// network-only: sempre busca na rede
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});