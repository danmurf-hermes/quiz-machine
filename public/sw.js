// Minimal offline cache: app shell + question data.
// Only registers on secure contexts (localhost/HTTPS) — LAN IP serving is a no-op there.
const CACHE = 'itbox-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/data/easy.json',
  '/data/medium.json',
  '/data/hard.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
