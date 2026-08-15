const CACHE_NAME = 'strikeiq-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/LOGO_STRIKEIQ.png',
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

// ─────────────────────────────────────────────────────
// ESTRATEGIAS DE CACHÉ
//
// App shell (index.html, app.js, style.css y la navegación a './'):
//   NETWORK-FIRST. Con cache-first hacía falta abrir la app dos veces para
//   ver un despliegue nuevo: la primera apertura servía el build viejo desde
//   caché mientras el SW se actualizaba de fondo. Ahora, con red, siempre se
//   ve la última versión al instante; sin red, se sirve la copia cacheada.
//
// Todo lo demás (imágenes, audio, manifest):
//   CACHE-FIRST. No cambian casi nunca y pesan mucho (musica_settings.wav
//   son 20MB), así que responder desde caché es lo correcto. Lo que no esté
//   cacheado se descarga y se guarda al vuelo.
// ─────────────────────────────────────────────────────
const SHELL_FILES = ['index.html', 'app.js', 'style.css'];

function isShellRequest(request) {
  // Una navegación (abrir la app / recargar) siempre resuelve al HTML
  if (request.mode === 'navigate') return true;
  const path = new URL(request.url).pathname;
  const file = path.substring(path.lastIndexOf('/') + 1);
  if (file === '') return true;                      // './' -> index.html
  return SHELL_FILES.indexOf(file) !== -1;
}

// Guarda una copia en caché sin bloquear la respuesta al navegador
function cachePut(request, response) {
  if (!response || !response.ok) return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then(c => c.put(request, copy)).catch(() => {});
}

function networkFirst(request) {
  return fetch(request)
    .then(res => { cachePut(request, res); return res; })
    .catch(() =>
      // Sin red: la copia cacheada. Para navegaciones cae a index.html, que
      // es lo que hay precacheado aunque la URL lleve query string o hash.
      caches.match(request).then(cached =>
        cached || caches.match('./index.html') || Response.error()
      )
    );
}

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request)
      .then(res => { cachePut(request, res); return res; })
      .catch(() => cached || Response.error());
  });
}

self.addEventListener('fetch', e => {
  const request = e.request;
  if (request.method !== 'GET') return;              // POST/PUT van directos a red

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // Supabase y demás: sin tocar

  e.respondWith(isShellRequest(request) ? networkFirst(request) : cacheFirst(request));
});
