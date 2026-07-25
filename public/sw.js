/* LifeHub service worker — instalabilidad PWA + Web Push */
const VERSION = 'lifehub-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler mínimo (requerido para instalabilidad). Deja pasar la red tal cual;
// no cacheamos páginas para evitar servir contenido viejo de la app.
self.addEventListener('fetch', () => {});

// Llega un push del servidor → mostramos la notificación.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: 'LifeHub', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'LifeHub';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/hub' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic en la notificación → enfoca una pestaña abierta o abre la app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/hub';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
  );
});
