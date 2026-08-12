const CACHE_NAME = 'jadwal-sholat-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for the app page itself (so schedule/config updates aren't stuck stale),
  // cache-first for static assets (icons, manifest) so the app still opens offline.
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});

// Notification action buttons ("Hadir" / "Berhalangan") are handled right here in the
// service worker, so tapping them works even if the app page itself isn't open/focused.
self.addEventListener('notificationclick', (event) => {
  const action = event.action; // 'hadir' | 'absen' | '' (plain tap on the notification body)
  const data = event.notification.data || {};
  event.notification.close();

  if (action === 'hadir' || action === 'absen') {
    event.waitUntil(
      (async () => {
        if (data.syncUrl) {
          try {
            await fetch(data.syncUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ type: 'confirm', iso: data.iso, prayerKey: data.prayerKey, status: action }),
            });
          } catch (e) { /* offline — best effort only */ }
        }
        const clientsList = await self.clients.matchAll({ type: 'window' });
        clientsList.forEach((c) => c.postMessage({ type: 'IMAM_CONFIRM', iso: data.iso, prayerKey: data.prayerKey, status: action }));
      })()
    );
  } else {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientsList) => {
        for (const c of clientsList) { if ('focus' in c) return c.focus(); }
        if (self.clients.openWindow) return self.clients.openWindow(data.imamUrl || './index.html?imam=1');
      })
    );
  }
});
