// Sparkle Service Worker — offline-first for the shell
const CACHE = 'sparkle-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sparkle_assets/onboarding_hero.jpg',
  './sparkle_assets/toeic_p1/p1_01.jpg',
  './sparkle_assets/toeic_p1/p1_02.jpg',
  './sparkle_assets/toeic_p1/p1_03.jpg',
  './sparkle_assets/toeic_p1/p1_04.jpg',
  './sparkle_assets/toeic_p1/p1_05.jpg',
  './sparkle_assets/toeic_p1/p1_06.jpg',
  './sparkle_assets/toeic_p1/p1_07.jpg',
  './sparkle_assets/toeic_p1/p1_08.jpg',
  './sparkle_assets/toeic_p1/p1_09.jpg',
  './sparkle_assets/toeic_p1/p1_10.jpg',
  './sparkle_assets/toeic_p1/p1_11.jpg',
  './sparkle_assets/toeic_p1/p1_12.jpg',
  './sparkle_assets/toeic_p1/p1_13.jpg',
  './sparkle_assets/toeic_p1/p1_14.jpg',
  './sparkle_assets/toeic_p1/p1_15.jpg',
  './sparkle_assets/toeic_p1/p1_16.jpg',
  './sparkle_assets/toeic_p1/p1_17.jpg',
  './sparkle_assets/toeic_p1/p1_18.jpg',
  './sparkle_assets/toeic_p1/p1_19.jpg',
  './sparkle_assets/toeic_p1/p1_20.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for same-origin (so active development changes show up immediately);
// falls back to cache only when offline. Cache still keeps the app installable/offline-capable.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Stale-while-revalidate for CDN (fonts, GSAP)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetching = fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => cached);
      return cached || fetching;
    })
  );
});
