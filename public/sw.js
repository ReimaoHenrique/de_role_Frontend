const CACHE_NAME = "plataforma-ingressos-v4";

// Apenas o shell mínimo é pré-cacheado. Páginas/API NÃO entram no cache
// para evitar servir conteúdo velho (ou dados quebrados) no iOS.
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Em ambiente local de desenvolvimento, nunca intercepta para evitar chunks obsoletos do Turbopack
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

  // Recursos externos (API do gateway, imagens remotas): sempre da rede.
  if (url.origin !== self.location.origin) return;

  // Nunca cachear chamadas de API/rotas do servidor.
  if (url.pathname.startsWith("/api/")) return;

  // Navegação: rede primeiro (sem cache no caminho) e só usa o shell como
  // fallback offline. No iOS o fetch do SW não pode devolver HTML de cache
  // quando há rede, pois isso quebra a atualização do app.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match("/");
      })
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Demais requisições same-origin: rede com fallback para o cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
