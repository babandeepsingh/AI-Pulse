/* AI News service worker — handles Web Push and notification clicks. */

self.addEventListener('install', () => {
  // Activate the new worker as soon as it is installed.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'AI News', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'AI News';
  const options = {
    body: payload.body || 'A new article was just published.',
    icon: payload.icon || '/icon-192.png',
    badge: '/badge-96.png',
    image: payload.image || undefined,
    tag: payload.tag || 'ai-news',
    renotify: true,
    timestamp: Date.now(),
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || '/';
  const targetUrl = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      // Reuse an already-open tab of the site when possible.
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(targetUrl).then((c) => (c ? c.focus() : undefined));
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // The browser rotated the subscription — re-subscribe and tell the server.
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        (event.oldSubscription && event.oldSubscription.options
          ? event.oldSubscription.options.applicationServerKey
          : null) || null;

      if (!applicationServerKey) return;

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
    })()
  );
});
