const CACHE_NAME = 'inventario-cache-v4';
const ASSETS = [
  '/InventarioEyE/Inventario/',
  '/InventarioEyE/Inventario/index.html',
  '/InventarioEyE/Inventario/dashboard.html',
  '/InventarioEyE/Inventario/historial.html',
  '/InventarioEyE/Inventario/styles.css',
  '/InventarioEyE/Inventario/auth.js',
  '/InventarioEyE/Inventario/inventory.js',
  '/InventarioEyE/Inventario/history.js',
  '/InventarioEyE/Inventario/export.js',
  '/InventarioEyE/Inventario/img/logo.png',
  '/InventarioEyE/Inventario/js/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
