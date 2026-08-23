const CACHE_VERSION = "v1";
const CORE_CACHE = `shambala-core-${CACHE_VERSION}`;
const MEDIA_CACHE = `shambala-media-${CACHE_VERSION}`;
const CACHE_PREFIX = "shambala-";

const coreAssets = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./data/merged.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./vendor/maplibre-gl/LICENSE.txt",
  "./vendor/maplibre-gl/maplibre-gl.css",
  "./vendor/maplibre-gl/maplibre-gl.mjs",
  "./vendor/maplibre-gl/maplibre-gl-shared.mjs",
  "./vendor/maplibre-gl/maplibre-gl-worker.mjs",
  "./images-data/957b81be-9dee-42ca-9fb9-a057a90071b1.png",
  "./images-data/69726d3a-7238-4ea3-8200-2e7505b3b174.png",
  "./images-data/6fb27a6f-cf86-4ee7-acc3-3b8365063ac9.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(coreAssets))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && ![CORE_CACHE, MEDIA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return cache.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CORE_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  return await refresh || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, CORE_CACHE)
        .then((response) => response || caches.match(new URL("./index.html", self.registration.scope).href))
    );
    return;
  }

  if (url.pathname.endsWith("/data/merged.json")) {
    event.respondWith(networkFirst(request, CORE_CACHE));
    return;
  }

  if (url.pathname.includes("/images-data/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
