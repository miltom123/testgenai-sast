// ==============================================================================
// Service Worker Cache Eviction & Auto-Clean
// Limpia obligatoriamente la caché persistente offline del navegador
// ==============================================================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      });
    })
  );
});

// Nunca interceptar peticiones; pasar siempre a la red
self.addEventListener('fetch', () => {
  return;
});
