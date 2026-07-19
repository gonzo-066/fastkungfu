const CACHE_NAME = 'impactlab-v43';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/LOGO_IMPACTLAB.png',
  './assets/icon-ultimo-golpe.png',
  './assets/icon-record.png',
  './assets/icon-vs-ayer.png',
  './assets/Card-reacci%C3%B3n3.png',
  './assets/card-potencia3.png',
  './assets/card-combo4.png',
  './assets/card-colores5.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
