/* Monage Service Worker — Batch O1 (read-offline foundation).
 *
 * Strategi (semua GET, same-origin saja; mutation/POST dibiarkan ke jaringan):
 *  - navigasi (SPA)  → network-first, fallback app shell (index.html) tersimpan
 *  - GET /api/*      → network-first, fallback cache (data terakhir saat offline)
 *  - aset statis     → stale-while-revalidate
 *
 * Tanpa precache manifest (tidak butuh build plugin) — caching dilakukan runtime,
 * jadi app harus pernah dibuka online sekali agar shell & data ter-cache.
 * Mutation TIDAK di-cache di sini; offline-write ditangani Outbox (batch O3).
 */
const VERSION = "v1";
const STATIC_CACHE = `monage-static-${VERSION}`;
const API_CACHE = `monage-api-${VERSION}`;
const KEEP = new Set([STATIC_CACHE, API_CACHE]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("monage-") && !KEEP.has(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // mutation → biarkan ke jaringan (Outbox urus)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // pihak ketiga → lewati

  if (req.mode === "navigate") {
    event.respondWith(networkFirstNav(req));
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstApi(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirstNav(req) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const res = await fetch(req);
    cache.put("/index.html", res.clone());
    return res;
  } catch {
    return (
      (await cache.match("/index.html")) ||
      (await cache.match(req)) ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

async function networkFirstApi(req) {
  const cache = await caches.open(API_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) {
      // Tandai bahwa ini dari cache (FE bisa pakai untuk indikator stale).
      const headers = new Headers(cached.headers);
      headers.set("X-Monage-From-Cache", "1");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    throw err; // tidak ada cache → biarkan axios menerima network error
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
