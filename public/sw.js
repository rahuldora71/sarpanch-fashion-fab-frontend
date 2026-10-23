/**
 * Sarpanch Fashion Fab ERP — Production Service Worker
 *
 * CACHING & SECURITY POLICY:
 * 1. STRICT API EXCLUSION:
 *    All `/api/*` endpoints (authenticated orders, payments, customers, measurements,
 *    worker payroll, production stats) are STRICTLY Network-Only.
 *    They are NEVER stored in browser cache to prevent financial data staleness,
 *    cross-user leakage, or offline data inconsistencies.
 *
 * 2. APP SHELL & STATIC ASSETS:
 *    Navigation requests use Network-First with cached SPA shell fallback.
 *    Static bundles (/assets/*, fonts, /icons/*) use Stale-While-Revalidate.
 */

const CACHE_VERSION = "sff-static-v1.0.1";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

// Install: precache the offline app shell with per-asset resilience
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn("[SW] Optional precache asset skipped:", asset, err);
          }
        }
        return self.skipWaiting();
      })
  );
});

// Activate: clean up outdated cache buckets immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_VERSION) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: enforce strict isolation between static assets and sensitive ERP APIs
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET REQUESTS: always bypass service worker
  if (request.method !== "GET") {
    return;
  }

  // 2. SENSITIVE ERP API CALLS (/api/* or Spring Boot port 8082):
  // NEVER CACHE! Always route direct to network to protect financial & customer data
  if (
    url.pathname.startsWith("/api/") ||
    url.port === "8082" ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/payments") && request.headers.get("accept")?.includes("application/json") ||
    url.pathname.includes("/orders") && request.headers.get("accept")?.includes("application/json") ||
    url.pathname.includes("/customers") && request.headers.get("accept")?.includes("application/json")
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message:
              "You are currently offline. Live tailoring & billing records require an active network connection.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // 3. PAGE NAVIGATION REQUESTS: Network-First with /index.html SPA fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put("/index.html", clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If network is offline, return cached index.html shell so React Router mounts
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;

          return new Response(
            "<!doctype html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Sarpanch Fashion Fab</title></head><body style='font-family:sans-serif;text-align:center;padding:40px;background:#09090b;color:#f4f4f5;'><h2>Sarpanch Fashion Fab ERP</h2><p>Please connect to the workshop Wi-Fi network to access live records.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // 4. STATIC ASSETS (/assets/*, fonts, icons, CSS, JS): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// Immediate reload trigger for client apps when user accepts an update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
