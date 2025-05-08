const CACHE_NAME = 'inventario-cache-v3';
const urlsToCache = [
  '/TIENDA-E-E/',
  '/TIENDA-E-E/index.html',
  '/TIENDA-E-E/dashboard.html',
  '/TIENDA-E-E/historial.html',
  '/TIENDA-E-E/styles.css',
  '/TIENDA-E-E/auth.js',
  '/TIENDA-E-E/inventory.js',
  '/TIENDA-E-E/history.js',
  '/TIENDA-E-E/export.js',
  '/TIENDA-E-E/img/logo.png',
  '/TIENDA-E-E/js/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
