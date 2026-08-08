// Minimal offline cache: app shell + question data.
// Only registers on secure contexts (localhost/HTTPS) — LAN IP serving is a no-op there.
const CACHE = 'quizmachine-v2';
const ASSETS = [
  './',
  './index.html',
  './data/easy.json',
  './data/medium.json',
  './data/hard.json',
  './music/entertainer.mp3',
  './music/maple_leaf.mp3',
  './music/easy_winners.mp3',
  './music/elite_syncopations.mp3',
  './music/peacherine.mp3',
  './music/fig_leaf.mp3',
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
  const { request } = e;

  // HTML navigations: network-first so fresh deploys always win,
  // cache fallback for offline (the pub).
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: cache-first, network fallback.
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request))
  );
});
