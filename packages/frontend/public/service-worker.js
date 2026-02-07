// Временный service worker для development режима
// В production используется скомпилированная версия из src/service-worker.ts

const cacheName = 'EasyChat-dev-' + Date.now()

const filesToCache = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install (dev mode)')

    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell')
            return cache.addAll(filesToCache)
        }),
    )

    self.skipWaiting()
})

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate (dev mode)')
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(
                keyList.map(function (key) {
                    if (key !== cacheName) {
                        console.log('[ServiceWorker] Removing old cache', key)
                        return caches.delete(key)
                    }
                }),
            )
        }),
    )
    return self.clients.claim()
})

self.addEventListener('fetch', function (e) {
    // В dev режиме не кэшируем, чтобы видеть изменения
    e.respondWith(fetch(e.request))
})
