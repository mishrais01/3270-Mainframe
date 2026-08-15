// Service worker for the 3270 Mainframe Terminal PWA.
// Strategy: network-first with cache fallback. Every load tries to fetch
// the latest files from the network (and updates the cache with whatever
// it gets); the cache is only used as a fallback when there's no network
// (fully offline). This means new content you publish shows up on next
// load automatically -- no manual cache-busting needed. Bump CACHE_NAME
// on major changes if you ever want to force-purge old cached entries.
const CACHE_NAME = 'mf3270-shell-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // offline: fall back to last-known-good
  );
});
