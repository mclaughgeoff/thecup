// Service worker for The Cup web push notifications.
// No install/activate hooks beyond skipWaiting — we only care about push + click.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'The Cup', body: event.data.text(), url: '/dashboard' };
  }
  const { title = 'The Cup', body = '', url = '/dashboard', tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        // If an app tab is already open, focus it and navigate there.
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client) await client.navigate(url);
            return;
          } catch {}
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
