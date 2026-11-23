const CACHE = 'imayaru-v6';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'imayaru-cfg').map(k => caches.delete(k)))));
  self.clients.claim();
});
// ネット優先、失敗したらキャッシュ（更新が反映されやすく、オフラインでも開ける）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : clients.openWindow('./')));
});

// サーバーからのプッシュ（本文なし）。表示内容はサーバーに取りに行く
self.addEventListener('push', e => e.waitUntil((async () => {
  let d = { title: 'いまやる', body: 'ひとつだけ確認しよう' };
  try {
    const c = await caches.open('imayaru-cfg'), r = await c.match('cfg'), cfg = await r.json();
    const x = await fetch(cfg.url + '/api/pending', { headers: { Authorization: 'Bearer ' + cfg.token } });
    if (x.ok) d = await x.json();
  } catch (_) {}
  await self.registration.showNotification(d.title, { body: d.body, tag: 'imayaru', renotify: true });
})()));
