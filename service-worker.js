const CACHE_VERSION = "v8";
const CORE_CACHE = `shambala-core-${CACHE_VERSION}`;
const MEDIA_CACHE = "shambala-media";
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

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function cacheSummary(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  let bytes = 0;
  for (const request of requests) {
    const response = await cache.match(request);
    bytes += Number(response?.headers.get("content-length") || 0);
  }
  return { entries: requests.length, bytes };
}

async function getOfflineStatus() {
  const cache = await caches.open(CORE_CACHE);
  let coreCached = 0;
  for (const asset of coreAssets) {
    if (await cache.match(scopedUrl(asset))) coreCached += 1;
  }
  return {
    cacheVersion: CACHE_VERSION,
    coreCache: CORE_CACHE,
    mediaCache: MEDIA_CACHE,
    coreExpected: coreAssets.length,
    coreCached,
    core: await cacheSummary(CORE_CACHE),
    media: await cacheSummary(MEDIA_CACHE)
  };
}

async function repairCore(report) {
  const cache = await caches.open(CORE_CACHE);
  const failures = [];
  let completed = 0;
  for (const asset of coreAssets) {
    try {
      const request = new Request(scopedUrl(asset), { cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(request, response);
    } catch {
      failures.push(asset);
    }
    completed += 1;
    report({ type: "progress", completed, total: coreAssets.length });
  }
  if (failures.length) throw new Error(`Could not refresh ${failures.length} core file(s)`);
  return getOfflineStatus();
}

async function cacheMedia(urls, report) {
  const cache = await caches.open(MEDIA_CACHE);
  const pending = [...new Set(urls)].filter((value) => {
    const url = new URL(value, self.registration.scope);
    return url.origin === self.location.origin && url.pathname.includes("/images-data/");
  });
  let cursor = 0;
  let completed = 0;
  let downloaded = 0;
  let failed = 0;

  async function worker() {
    while (cursor < pending.length) {
      const index = cursor++;
      const request = new Request(new URL(pending[index], self.registration.scope).href);
      try {
        if (!await cache.match(request)) {
          const response = await fetch(request);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(request, response);
          downloaded += 1;
        }
      } catch {
        failed += 1;
      }
      completed += 1;
      report({ type: "progress", completed, total: pending.length });
    }
  }

  await Promise.all(Array.from({ length: 4 }, () => worker()));
  return { downloaded, failed, status: await getOfflineStatus() };
}

self.addEventListener("message", (event) => {
  const port = event.ports[0];
  const report = (message) => port?.postMessage(message);
  const type = event.data?.type;

  if (type === "GET_OFFLINE_STATUS") {
    event.waitUntil(
      getOfflineStatus()
        .then((status) => report({ type: "complete", status }))
        .catch((error) => report({ type: "error", message: error.message }))
    );
  } else if (type === "REPAIR_CORE") {
    event.waitUntil(
      repairCore(report)
        .then((status) => report({ type: "complete", status }))
        .catch((error) => report({ type: "error", message: error.message }))
    );
  } else if (type === "CACHE_MEDIA") {
    event.waitUntil(
      cacheMedia(event.data.urls || [], report)
        .then((result) => report({ type: "complete", result }))
        .catch((error) => report({ type: "error", message: error.message }))
    );
  } else if (type === "CLEAR_MEDIA") {
    event.waitUntil(
      caches.delete(MEDIA_CACHE)
        .then(() => getOfflineStatus())
        .then((status) => report({ type: "complete", status }))
        .catch((error) => report({ type: "error", message: error.message }))
    );
  }
});

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

async function navigationCacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true })
    || await caches.match(scopedUrl("./index.html"));
  return cached || fetch(request);
}

async function imageCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const cache = await caches.open(MEDIA_CACHE);
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationCacheFirst(request));
    return;
  }

  if (url.pathname.endsWith("/data/merged.json")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.includes("/images-data/")) {
    event.respondWith(imageCacheFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
