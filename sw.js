const CACHE_NAME = 'ramadan-1447-v2';

// Core assets — the app cannot work without these
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data/manifest.json',
  '/data/icon.png',
  '/data/hadiths.json',
  '/data/quran.json',
  '/data/todo.json',
  '/data/notes.json'
];

// ── Install: pre-cache core assets ────────────────────────────────────────────
// Uses individual try/catch instead of addAll() so one failure doesn't
// kill the entire service worker install.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to precache: ${url}`, err);
          })
        )
      );
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length) {
        console.warn(`[SW] ${failed.length} asset(s) failed to precache`);
      }
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // ── External (fonts, CDN icons) — Network first, cache fallback ──
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── JSON data files — Network first, cache fallback ──
  // Always try to get fresh data, but serve cached if offline
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── Everything else (HTML, CSS, JS, images) — Cache first, network fallback ──
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // If HTML navigation fails completely, serve index from cache
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
