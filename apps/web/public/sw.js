/* Service Worker — فقط برای Web Push (اعلان دایرکت وقتی اپ بسته/پس‌زمینه است). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'بیلیارد هاب', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'بیلیارد هاب';
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/Logo/bh-icon-512-v4.png',
    badge: data.badge || '/images/Logo/bh-icon-512-v4.png',
    dir: 'rtl',
    lang: 'fa',
    tag: data.tag || 'bh-dm',
    renotify: true,
    data: { url: data.url || '/direct' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/direct';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.includes('/direct') && 'focus' in c) return c.focus(); }
    for (const c of all) { if ('navigate' in c) { try { await c.navigate(url); } catch (e) {} return c.focus(); } }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
