// Service Worker - network-first 캐싱 전략
// 매 요청마다 네트워크에서 최신 파일을 우선 가져오고, 오프라인일 때만 캐시 사용
const CACHE_NAME = 'amway-sim-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // 기존 SW 대기 없이 즉시 활성화
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim()) // 즉시 모든 탭에 적용
    );
});

self.addEventListener('fetch', (event) => {
    // 동일 출처 요청만 처리 (livere 댓글 등 외부 스크립트는 그대로 통과)
    if (new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request) // 1) 네트워크 최신 파일 우선
            .then((networkResponse) => {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                return networkResponse;
            })
            .catch(() => {
                // 2) 오프라인일 때만 캐시된 파일 사용
                return caches.match(event.request);
            })
    );
});
