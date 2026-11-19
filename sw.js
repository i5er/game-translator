// Service Worker: يخلي الموقع يفتح فوراً كتطبيق ويشتغل حتى لو النت ضعيف.
// - الصفحة نفسها: من الشبكة أولاً (عشان التحديثات توصل)، ولو ما فيه نت من النسخة المحفوظة
// - الملفات الثابتة والمكتبات: من المحفوظ فوراً، وتتحدث بالخلفية
// - طلبات الترجمة: ما نلمسها أبداً
const VERSION = 'gt-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const CDN = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if(!same && !CDN.includes(url.hostname)) return;            // الترجمة وغيرها: مباشرة من الشبكة

  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
