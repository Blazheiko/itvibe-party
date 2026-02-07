import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Service Worker Management
class ServiceWorkerManager {
    private registration: ServiceWorkerRegistration | null = null

    async register(): Promise<ServiceWorkerRegistration | null> {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SW] Service workers not supported')
            return null
        }

        try {
            console.log('[SW] Registering service worker...')

            this.registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/',
                updateViaCache: 'none',
            })

            console.log('[SW] Service worker registered:', this.registration)
            this.setupUpdateHandlers()
            return this.registration
        } catch (error) {
            console.error('[SW] Registration failed:', error)
            return null
        }
    }

    async checkForUpdates(): Promise<void> {
        if (!this.registration) return

        try {
            await this.registration.update()
            console.log('[SW] Update check completed')
        } catch (error) {
            console.error('[SW] Update check failed:', error)
        }
    }

    private setupUpdateHandlers(): void {
        if (!this.registration) return

        this.registration.addEventListener('updatefound', () => {
            console.log('[SW] New service worker found')
            const newWorker = this.registration!.installing

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        console.log('[SW] New service worker activated')
                        showUpdateNotification()
                    }
                })
            }
        })

        if (this.registration.waiting) {
            console.log('[SW] Service worker waiting to activate')
            showUpdateNotification()
        }
    }
}

// Push Notifications
// async function requestNotificationPermission(): Promise<NotificationPermission> {
//     if (!('Notification' in window)) {
//         console.warn('[Push] Notifications not supported')
//         return 'denied'
//     }

//     if (Notification.permission !== 'granted') {
//         const permission = await Notification.requestPermission()
//         console.log('[Push] Permission result:', permission)
//         return permission
//     }

//     return Notification.permission
// }

// Инициализация Service Worker
async function initializeServiceWorker() {
    try {
        const swManager = new ServiceWorkerManager()
        const registration = await swManager.register()

        if (registration) {
            console.log('[SW] Service worker initialized successfully')

            // Слушаем сообщения от service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('[SW] Message from service worker:', event.data)

                if (event.data === 'NEW_VERSION') {
                    showUpdateNotification()
                }
            })

            // Запрашиваем разрешение на уведомления
            // await requestNotificationPermission()

            // Проверяем обновления каждую минуту
            setInterval(async () => {
                await swManager.checkForUpdates()
            }, 60000)
        }
    } catch (error) {
        console.error('[SW] Service worker initialization failed:', error)
    }
}

// Функция показа уведомления о новой версии
function showUpdateNotification() {
    console.log('[SW] Showing update notification')

    // Создаем простое уведомление
    const notification = document.createElement('div')
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #145fc2;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Inter, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `

    notification.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 600;">
            🚀 New version available!
        </div>
        <div style="margin-bottom: 12px; opacity: 0.9;">
            Refresh to get the latest features
        </div>
        <button onclick="window.location.reload()" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            font-weight: 500;
        ">Refresh</button>
        <button onclick="this.parentElement.remove()" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        ">Later</button>
    `

    // Добавляем стили анимации
    const style = document.createElement('style')
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `
    document.head.appendChild(style)

    document.body.appendChild(notification)

    // Автоматически скрываем через 10 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease reverse'
            setTimeout(() => notification.remove(), 300)
        }
    }, 10000)
}

// Запускаем инициализацию после монтирования приложения
initializeServiceWorker()
