
/* Fish Bill Offline Service Worker v2 */
const CACHE_NAME = "fish-bill-offline-v2";

const BASE = self.registration.scope;

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./fish-192.png",
  "./fish-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(
        FILES.map(file => new URL(file, BASE).href)
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("fish-bill-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin ||
      !url.href.startsWith(BASE)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const page = new URL("./index.html", BASE).href;

        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(page, response.clone());
          }
          return response;
        } catch (error) {
          return await cache.match(page) ||
            new Response("Fish Bill offline page unavailable.", {
              status: 503
            });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);

      if (saved) return saved;

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});
        
