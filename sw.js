// KeyBox Service Worker
const CACHE_NAME = 'keybox-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-1024.png'
];

// 安装时预缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求，优先缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // 命中缓存，返回缓存内容
        return response;
      }
      // 否则发起网络请求
      return fetch(event.request).then(networkResponse => {
        // 只缓存成功且同源的资源
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 网络失败，返回离线提示（可自定义）
        return new Response('您目前处于离线状态，请检查网络连接。', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});