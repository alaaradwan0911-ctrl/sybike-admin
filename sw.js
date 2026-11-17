// غيّر رقم النسخة عند كل تحديث كبير
const CACHE_NAME = 'sybike-admin-v1';
const ASSETS = [
  './', './index.html', './premium.css', './manifest.json',
  './favicon.png', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

// تثبيت: نخزّن كل ملف لحاله، وإذا ملف ناقص ما بيفشل التثبيت كله
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(ASSETS.map(function(url) {
        return cache.add(url).catch(function() {});
      }));
    })
  );
  self.skipWaiting();
});

// تفعيل: حذف الكاش القديم
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

// جلب: الشبكة أولاً (دائماً أحدث نسخة)، والكاش فقط عند انقطاع الإنترنت
self.addEventListener('fetch', function(e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // لا نتدخل بطلبات فايربيس والخطوط
  e.respondWith(
    fetch(req).then(function(res) {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      return caches.match(req).then(function(r) { return r || caches.match('./index.html'); });
    })
  );
});
