// ============================================================
//  AI Exam Portal — Service Worker
//  Satisfies Chrome's PWA installability checklist:
//    ✅ Registered service worker
//    ✅ fetch event handler (intercepts network requests)
//    ✅ Works on HTTPS (Vercel handles this)
// ============================================================

const CACHE_NAME = 'ai-exam-v1';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/logo192.png',
  '/icons/logo512.png',
  '/favicon.svg',
];

// ─── INSTALL ─────────────────────────────────────────────────
// Called once when SW is first registered.
// Pre-caches critical shell assets so the app loads offline.
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Force this SW to become active immediately (don't wait for old SW to die)
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────
// Called after install. Clean up old caches from previous versions.
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

// ─── FETCH ───────────────────────────────────────────────────
// Intercepts every network request — THIS IS REQUIRED for Chrome
// to consider the app installable.
//
// Strategy:
//   • API calls (/api/*) → Network First  (always fresh data)
//   • Everything else   → Cache First     (fast, works offline)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // API calls: Network First → fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful API responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback: serve from cache if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets + page navigation: Cache First → fall back to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache → fetch from network and cache it
      return fetch(request).then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});
