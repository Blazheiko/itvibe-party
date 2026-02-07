/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope
declare const BUILD_TIMESTAMP: string

const cacheName =
    'EasyChat-' + (typeof BUILD_TIMESTAMP !== 'undefined' ? BUILD_TIMESTAMP : Date.now())

const filesToCache = [
    '/',
    '/manifest.json',
    '/favicon.svg',
    '/icons/badge-72.png',
    '/icons/icon_192x192.png',
    '/icons/icon_512x512.png',
    '/audio/notification.mp3',
    '/audio/notification_1.mp3',
    '/audio/click-button-140881.mp3',
    '/audio/pdjyznja.mp3',
]

// Helper function to check if a request URL has a cacheable scheme
function isCacheableRequest(request: Request): boolean {
    const url = new URL(request.url)
    // Only cache http and https requests
    return url.protocol === 'http:' || url.protocol === 'https:'
}

self.addEventListener('install', function (e: ExtendableEvent) {
    console.log('[ServiceWorker] Install')

    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell')
            return cache.addAll(filesToCache)
        }),
    )

    self.skipWaiting()
})

self.addEventListener('activate', function (e: ExtendableEvent) {
    console.log('[ServiceWorker] Activate')
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(
                keyList.map(function (key) {
                    if (key !== cacheName) {
                        console.log('[ServiceWorker] Removing old cache', key)
                        sendMessageToAll('NEW_VERSION')
                        return caches.delete(key)
                    }
                }),
            )
        }),
    )
    return self.clients.claim()
})

self.addEventListener('fetch', function (e: FetchEvent) {
    console.log('[ServiceWorker] Fetch', e.request.url)

    // Skip requests with unsupported schemes (chrome-extension, data, blob, etc.)
    if (!isCacheableRequest(e.request)) {
        return
    }

    // Стратегия кэширования: Cache First для статических ресурсов
    if (
        e.request.url.includes('/icons/') ||
        e.request.url.includes('/audio/') ||
        e.request.url.includes('manifest.json') ||
        e.request.url.includes('favicon.svg') ||
        e.request.url.includes('.css') ||
        e.request.url.includes('/assets/')
    ) {
        e.respondWith(
            caches.match(e.request).then(function (response) {
                return (
                    response ||
                    fetch(e.request).then(function (fetchResponse) {
                        if (fetchResponse.status === 200 && isCacheableRequest(e.request)) {
                            const responseClone = fetchResponse.clone()
                            caches.open(cacheName).then(function (cache) {
                                cache.put(e.request, responseClone)
                            })
                        }
                        return fetchResponse
                    })
                )
            }),
        )
    }
    // Network First для API запросов
    else if (e.request.url.includes('/api/')) {
        e.respondWith(
            fetch(e.request)
                .then(function (response) {
                    return response
                })
                .catch(function () {
                    return caches.match(e.request).then(function (cachedResponse) {
                        return cachedResponse || new Response('Network error', { status: 503 })
                    })
                }),
        )
    }
    // Network First для HTML страниц
    else if (e.request.mode === 'navigate' || e.request.destination === 'document') {
        e.respondWith(
            fetch(e.request)
                .then(function (response) {
                    if (response.status === 200 && isCacheableRequest(e.request)) {
                        const responseClone = response.clone()
                        caches.open(cacheName).then(function (cache) {
                            cache.put(e.request, responseClone)
                        })
                    }
                    return response
                })
                .catch(function () {
                    return caches.match(e.request).then(function (cachedResponse) {
                        if (cachedResponse) return cachedResponse
                        return caches.match('/').then(function (indexResponse) {
                            return indexResponse || new Response('Offline', { status: 503 })
                        })
                    })
                }),
        )
    }
    // Stale While Revalidate для остальных ресурсов
    else {
        e.respondWith(
            caches.match(e.request, { ignoreSearch: true }).then(function (response) {
                const fetchPromise = fetch(e.request).then(function (networkResponse) {
                    if (networkResponse.status === 200 && isCacheableRequest(e.request)) {
                        const responseClone = networkResponse.clone()
                        caches.open(cacheName).then(function (cache) {
                            cache.put(e.request, responseClone)
                        })
                    }
                    return networkResponse
                })

                return response || fetchPromise
            }),
        )
    }
})

// --- events from/to js application ---
function sendMessage(client: Client, msg: unknown): Promise<void> {
    return new Promise(function () {
        client.postMessage(msg)
    })
}

function sendMessageToAll(msg: unknown): void {
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            sendMessage(client, msg)
        })
    })
}

// --- message from js application ---
self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event && event.data) {
        if (event.data.message) {
            console.log('SW MESSAGE: ', event.data.message, event.data.data)
        }
    }
})

// --- web push notifications ---
interface ServiceWorkerNotificationAction {
    action: string
    title: string
}

interface ServiceWorkerNotificationOptions {
    body?: string
    icon?: string
    badge?: string
    vibrate?: number[]
    data?: Record<string, unknown>
    requireInteraction?: boolean
    actions?: ServiceWorkerNotificationAction[]
    title?: string
}

interface NotificationPayload {
    notification?: ServiceWorkerNotificationOptions
    data?: Record<string, unknown>
}

self.addEventListener('push', (event: PushEvent) => {
    console.log('[ServiceWorker] Push received:', event)

    let options: ServiceWorkerNotificationOptions = {
        body: 'You have a new message',
        icon: '/icons/icon_192x192.png',
        badge: '/icons/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
        },
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Open App',
            },
            {
                action: 'close',
                title: 'Close',
            },
        ],
    }

    if (event.data) {
        try {
            const payload: NotificationPayload = event.data.json()
            if (payload.notification) {
                options = { ...options, ...payload.notification }
            }
            if (payload.data) {
                options.data = { ...options.data, ...payload.data }
            }
        } catch {
            console.log('[ServiceWorker] Push payload not JSON:', event.data.text())
            options.body = event.data.text() || options.body
        }
    }

    const title = options.title || 'Easy Chat'

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    console.log('[ServiceWorker] Notification clicked:', event)
    event.notification.close()

    const url =
        event.notification.data && event.notification.data.url ? event.notification.data.url : '/'

    if (event.action === 'close') {
        return
    }

    event.waitUntil(
        self.clients
            .matchAll({
                type: 'window',
                includeUncontrolled: true,
            })
            .then((clientList) => {
                // Проверяем, есть ли уже открытое окно приложения
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i]
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus()
                    }
                }
                // Если нет открытого окна, открываем новое
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url)
                }
            }),
    )
})

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event: NotificationEvent) => {
    console.log('[ServiceWorker] Notification closed:', event)
})
