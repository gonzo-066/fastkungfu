const CACHE_NAME = 'impactlab-v52';
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
  './assets/card-colores5.jpg',
  // SFX cortos. Los pesados (10_segundos, puntaje_final, musica_settings)
  // se quedan fuera del precache para no alargar la instalación: se cachean
  // en runtime la primera vez que suenan.
  './assets/sounds/ring_inicial.wav',
  './assets/sounds/ring_final.wav',
  './assets/sounds/good_reaccion.wav',
  './assets/sounds/combo.wav',
  './assets/sounds/level_up.wav'
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
  const isSound = e.request.url.indexOf('/assets/sounds/') !== -1;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Los WAV grandes se guardan al vuelo: a partir de la segunda vez
        // suenan sin red y sin volver a descargar 20MB.
        if (isSound && res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
