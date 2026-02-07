import { ref, watch, reactive } from 'vue'
import { defineStore } from 'pinia'
import { pushSubscriptionApi } from '@/utils/api'

export interface IncomingCall {
    callerId: string | number
    callerName: string
    callType: 'video' | 'audio'
    offer?: RTCSessionDescriptionInit
}

export const useStateStore = defineStore('state', () => {
    const theme = localStorage.getItem('theme')
    const darkMode = ref(theme === 'dark')
    // const isLoading = ref(false)
    // const isOffline = ref(false)
    // const isMenuOpen = ref(false)
    const windowWidth = ref(window.innerWidth)
    const isMobile = ref(window.innerWidth <= 768)
    const isPWAMode = ref(false)

    // Push notifications state
    const notificationPermission = ref<NotificationPermission>('default')
    const pushSubscription = ref<PushSubscription | null>(null)
    const isSubscribedToPush = ref(false)
    const pushSubscriptionId = ref<number | null>(null)
    // const doubleCount = computed(() => count.value * 2)

    // Incoming call state
    const incomingCall = reactive<{
        isActive: boolean
        callerId: string | number | null
        callerName: string
        callType: 'video' | 'audio' | null
        offer: RTCSessionDescriptionInit | null
        isConnecting: boolean
        isConnected: boolean
        error: string | null
    }>({
        isActive: false,
        callerId: null,
        callerName: '',
        callType: null,
        offer: null,
        isConnecting: false,
        isConnected: false,
        error: null,
    })

    // Outgoing call state
    const outgoingCall = reactive<{
        isActive: boolean
        targetUserId: string | number | null
        targetName: string
        callType: 'video' | 'audio' | null
        isConnecting: boolean
        isConnected: boolean
        error: string | null
    }>({
        isActive: false,
        targetUserId: null,
        targetName: '',
        callType: null,
        isConnecting: false,
        isConnected: false,
        error: null,
    })

    const handleResize = () => {
        windowWidth.value = window.innerWidth
        isMobile.value = window.innerWidth <= 768
    }

    // Функция для определения режима PWA
    const checkPWAMode = () => {
        // Проверяем display-mode через CSS media query
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        // Дополнительная проверка для iOS Safari
        const isIOSStandalone =
            'standalone' in window.navigator &&
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true
        // Проверяем User Agent для Android
        const isAndroidApp = window.matchMedia('(display-mode: minimal-ui)').matches

        isPWAMode.value = isStandalone || isIOSStandalone || isAndroidApp
        return isPWAMode.value
    }

    // Инициализируем проверку PWA режима
    checkPWAMode()

    // Отслеживаем изменения display-mode
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)')
    const minimalUIMediaQuery = window.matchMedia('(display-mode: minimal-ui)')

    standaloneMediaQuery.addEventListener('change', checkPWAMode)
    minimalUIMediaQuery.addEventListener('change', checkPWAMode)

    window.addEventListener('resize', handleResize)

    // Push notifications initialization
    const initNotifications = () => {
        if ('Notification' in window) {
            notificationPermission.value = Notification.permission
        }
    }

    // Запрос разрешения на уведомления
    const requestNotificationPermission = async (): Promise<NotificationPermission> => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications')
            return 'denied'
        }

        const permission = await Notification.requestPermission()
        notificationPermission.value = permission
        return permission
    }

    // Функция для запроса разрешения при отправке сообщения
    const ensureNotificationPermission = async (): Promise<boolean> => {
        if (notificationPermission.value !== 'granted') {
            const permission = await requestNotificationPermission()
            return permission === 'granted'
        }
        return true
    }

    // Подписка на push уведомления
    const subscribeToPush = async (): Promise<PushSubscription | null> => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported')
            return null
        }

        try {
            const registration = await navigator.serviceWorker.ready

            // Проверяем существующую подписку
            const existingSubscription = await registration.pushManager.getSubscription()
            if (existingSubscription) {
                pushSubscription.value = existingSubscription
                isSubscribedToPush.value = true
                return existingSubscription
            }

            // Получаем VAPID ключ
            const vapidKey = await getVapidPublicKey()
            if (!isValidVapidKey(vapidKey)) {
                console.error('❌ VAPID ключ не настроен или невалиден')
                console.info('💡 Для настройки VAPID ключа:')
                console.info('1. Создайте VAPID ключи: npx web-push generate-vapid-keys')
                console.info(
                    '2. Добавьте публичный ключ в переменную окружения VITE_VAPID_PUBLIC_KEY',
                )
                console.info(
                    '3. Или настройте эндпоинт /api/push-subscriptions/vapid-public-key на сервере',
                )
                throw new Error('VAPID ключ не настроен')
            }

            // Создаем новую подписку
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey!).buffer as ArrayBuffer,
            })

            pushSubscription.value = subscription
            isSubscribedToPush.value = true

            // Отправляем подписку на сервер
            await sendSubscriptionToServer(subscription)

            return subscription
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
            if (error instanceof Error && error.message.includes('VAPID')) {
                // Показываем пользователю понятное сообщение об ошибке VAPID
                console.warn('⚠️ Push-уведомления временно недоступны (VAPID ключ не настроен)')
            }
            return null
        }
    }

    // Отписка от push уведомлений
    const unsubscribeFromPush = async (): Promise<boolean> => {
        if (!pushSubscription.value) {
            return true
        }

        try {
            const success = await pushSubscription.value.unsubscribe()
            if (success) {
                // Уведомляем сервер об отписке
                await removeSubscriptionFromServer(pushSubscription.value)

                pushSubscription.value = null
                isSubscribedToPush.value = false
            }
            return success
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error)
            return false
        }
    }

    // Вспомогательная функция для конвертации VAPID ключа
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    // Получение VAPID публичного ключа
    const getVapidPublicKey = async (): Promise<string | null> => {
        try {
            // Сначала пытаемся получить ключ с сервера
            const response = await pushSubscriptionApi.getVapidPublicKey()
            if (response.data && response.data.vapidPublicKey) {
                return response.data.vapidPublicKey
            }
        } catch (error) {
            console.warn('Не удалось получить VAPID ключ с сервера:', error)
        }

        // Fallback: используем ключ из переменных окружения или конфигурации
        const envVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
        if (envVapidKey && envVapidKey !== 'YOUR_VAPID_PUBLIC_KEY_HERE') {
            return envVapidKey
        }

        // Временный ключ для разработки (НЕ ИСПОЛЬЗОВАТЬ В ПРОДАКШЕНЕ!)
        console.warn('⚠️ Используется временный VAPID ключ для разработки')
        return null // Возвращаем null если нет валидного ключа
    }

    // Проверка валидности VAPID ключа
    const isValidVapidKey = (key: string | null): boolean => {
        if (!key) return false
        if (key === 'YOUR_VAPID_PUBLIC_KEY_HERE') return false
        if (key.length < 80) return false // VAPID ключи обычно длиннее
        return true
    }

    // Определение типа устройства
    const getDeviceType = (): string => {
        const userAgent = navigator.userAgent.toLowerCase()
        if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
            return 'mobile'
        }
        return 'desktop'
    }

    // Определение браузера и версии
    const getBrowserInfo = (): { name: string; version: string } => {
        const userAgent = navigator.userAgent
        const userAgentLower = userAgent.toLowerCase()

        let browserName = 'Unknown'
        let browserVersion = 'Unknown'

        if (userAgentLower.includes('chrome') && !userAgentLower.includes('edg')) {
            browserName = 'Chrome'
            const match = userAgent.match(/Chrome\/(\d+\.\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgentLower.includes('firefox')) {
            browserName = 'Firefox'
            const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgentLower.includes('safari') && !userAgentLower.includes('chrome')) {
            browserName = 'Safari'
            const match = userAgent.match(/Version\/(\d+\.\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgentLower.includes('edg')) {
            browserName = 'Edge'
            const match = userAgent.match(/Edg\/(\d+\.\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        }

        return { name: browserName, version: browserVersion }
    }

    // Определение операционной системы и версии
    const getOSInfo = (): { name: string; version: string } => {
        const userAgent = navigator.userAgent

        let osName = 'Unknown'
        let osVersion = 'Unknown'

        if (userAgent.includes('Windows NT')) {
            osName = 'Windows'
            const match = userAgent.match(/Windows NT (\d+\.\d+)/)
            osVersion = match ? match[1] : 'Unknown'
        } else if (userAgent.includes('Mac OS X')) {
            osName = 'macOS'
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
            osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown'
        } else if (userAgent.includes('Linux')) {
            osName = 'Linux'
            osVersion = 'Unknown'
        } else if (userAgent.includes('Android')) {
            osName = 'Android'
            const match = userAgent.match(/Android (\d+\.\d+)/)
            osVersion = match ? match[1] : 'Unknown'
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            osName = 'iOS'
            const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/)
            osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown'
        }

        return { name: osName, version: osVersion }
    }

    // Получение IP адреса (приблизительно через внешний сервис или будет установлен на сервере)
    const getClientIP = async (): Promise<string | null> => {
        try {
            // В реальном приложении IP будет определяться на сервере
            // Это только для демонстрации - можно убрать или использовать внешний API
            return null // Сервер сам определит IP из request headers
        } catch (error) {
            console.warn('Could not determine client IP:', error)
            return null
        }
    }

    // Отправка подписки на сервер
    const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
        try {
            const browserInfo = getBrowserInfo()
            const osInfo = getOSInfo()
            const clientIP = await getClientIP()

            const subscriptionData = {
                endpoint: subscription.endpoint,
                p256dhKey: arrayBufferToBase64(subscription.getKey('p256dh')),
                authKey: arrayBufferToBase64(subscription.getKey('auth')),
                userAgent: navigator.userAgent,
                ipAddress: clientIP || undefined,
                deviceType: getDeviceType(),
                browserName: browserInfo.name,
                browserVersion: browserInfo.version,
                osName: osInfo.name,
                osVersion: osInfo.version,
                notificationTypes: ['new_message', 'mention', 'system'], // Типы уведомлений по умолчанию
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }

            const response = await pushSubscriptionApi.createSubscription(subscriptionData)

            if (response.error) {
                console.error('Failed to save subscription to server:', response.error)
                throw new Error(response.error.message)
            }

            if (response.data) {
                pushSubscriptionId.value = response.data.id
                console.log('Subscription saved to server successfully:', response.data)

                // Отправляем уведомление о создании новой подписки
                try {
                    await pushSubscriptionApi.sendSubscriptionNotification({
                        type: 'subscription_enabled',
                        message: 'Создана новая push-подписка',
                        subscriptionId: response.data.id,
                        metadata: {
                            endpoint: subscription.endpoint,
                            deviceType: getDeviceType(),
                            browserName: browserInfo.name,
                            browserVersion: browserInfo.version,
                            osName: osInfo.name,
                            osVersion: osInfo.version,
                            timestamp: new Date().toISOString(),
                        },
                    })
                } catch (notificationError) {
                    console.warn(
                        'Не удалось отправить уведомление о создании подписки:',
                        notificationError,
                    )
                }
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error)
            throw error
        }
    }

    // Удаление подписки с сервера
    const removeSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
        try {
            if (pushSubscriptionId.value) {
                // Удаляем по ID если есть
                const currentSubscriptionId = pushSubscriptionId.value
                const response = await pushSubscriptionApi.deleteSubscription(currentSubscriptionId)

                if (response.error) {
                    console.error('Failed to remove subscription from server:', response.error)
                    throw new Error(response.error.message)
                }

                pushSubscriptionId.value = null
                console.log('Subscription removed from server successfully')

                // Отправляем уведомление об удалении подписки
                try {
                    await pushSubscriptionApi.sendSubscriptionNotification({
                        type: 'subscription_disabled',
                        message: 'Push-подписка была удалена',
                        subscriptionId: currentSubscriptionId,
                        metadata: {
                            reason: 'user_unsubscribed',
                            endpoint: subscription.endpoint,
                            timestamp: new Date().toISOString(),
                        },
                    })
                } catch (notificationError) {
                    console.warn(
                        'Не удалось отправить уведомление об удалении подписки:',
                        notificationError,
                    )
                }
            } else {
                // Удаляем по endpoint если нет ID
                const response = await pushSubscriptionApi.deleteSubscriptionByEndpoint(
                    subscription.endpoint,
                )

                if (response.error) {
                    console.error('Failed to remove subscription from server:', response.error)
                    throw new Error(response.error.message)
                }

                console.log('Subscription removed from server by endpoint successfully')

                // Отправляем уведомление об удалении подписки по endpoint
                try {
                    await pushSubscriptionApi.sendSubscriptionNotification({
                        type: 'subscription_disabled',
                        message: 'Push-подписка была удалена по endpoint',
                        metadata: {
                            reason: 'user_unsubscribed_by_endpoint',
                            endpoint: subscription.endpoint,
                            timestamp: new Date().toISOString(),
                        },
                    })
                } catch (notificationError) {
                    console.warn(
                        'Не удалось отправить уведомление об удалении подписки по endpoint:',
                        notificationError,
                    )
                }
            }
        } catch (error) {
            console.error('Error removing subscription from server:', error)
            throw error
        }
    }

    // Загрузка существующих подписок пользователя
    const loadUserSubscriptions = async (): Promise<void> => {
        try {
            const response = await pushSubscriptionApi.getSubscriptions()

            if (response.error) {
                console.error('Failed to load user subscriptions:', response.error)
                return
            }

            if (response.data && response.data.length > 0) {
                // Находим активную подписку для текущего устройства
                const activeSubscription = response.data.find((sub) => sub.is_active)
                if (activeSubscription) {
                    pushSubscriptionId.value = activeSubscription.id
                    isSubscribedToPush.value = true

                    // Проверяем, соответствует ли сохраненная подписка текущей
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready
                        const currentSubscription = await registration.pushManager.getSubscription()

                        if (
                            currentSubscription &&
                            currentSubscription.endpoint === activeSubscription.endpoint
                        ) {
                            pushSubscription.value = currentSubscription
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user subscriptions:', error)
        }
    }

    // Вспомогательная функция для конвертации ArrayBuffer в Base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
        if (!buffer) return ''
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
    }

    // Инициализация уведомлений при загрузке
    initNotifications()

    // Загружаем существующие подписки пользователя
    loadUserSubscriptions()

    // Применение темы
    function applyTheme() {
        if (darkMode.value) {
            document.documentElement.classList.add('dark-theme')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark-theme')
            localStorage.setItem('theme', 'light')
        }
    }

    // Вызываем сразу для инициализации темы
    applyTheme()

    function setDarkMode(value: boolean) {
        darkMode.value = value
        applyTheme()
    }

    // Отслеживаем изменения темы
    watch(darkMode, applyTheme)

    // Функции для управления входящим звонком
    const setIncomingCall = (call: IncomingCall) => {
        incomingCall.isActive = true
        incomingCall.callerId = call.callerId
        incomingCall.callerName = call.callerName
        incomingCall.callType = call.callType
        incomingCall.offer = call.offer || null
    }

    const clearIncomingCall = () => {
        incomingCall.isActive = false
        incomingCall.callerId = null
        incomingCall.callerName = ''
        incomingCall.callType = null
        incomingCall.offer = null
        incomingCall.isConnecting = false
        incomingCall.isConnected = false
        incomingCall.error = null
    }

    const setCallConnecting = () => {
        incomingCall.isConnecting = true
        incomingCall.isConnected = false
        incomingCall.error = null
    }

    const setCallConnected = () => {
        incomingCall.isConnecting = false
        incomingCall.isConnected = true
        incomingCall.error = null
    }

    const setCallError = (error: string) => {
        incomingCall.isConnecting = false
        incomingCall.isConnected = false
        incomingCall.error = error
    }

    // Outgoing call functions
    const setOutgoingCall = (data: {
        targetUserId: string | number
        targetName: string
        callType: 'video' | 'audio'
    }) => {
        outgoingCall.isActive = true
        outgoingCall.targetUserId = data.targetUserId
        outgoingCall.targetName = data.targetName
        outgoingCall.callType = data.callType
        outgoingCall.isConnecting = true
        outgoingCall.isConnected = false
        outgoingCall.error = null
    }

    const clearOutgoingCall = () => {
        outgoingCall.isActive = false
        outgoingCall.targetUserId = null
        outgoingCall.targetName = ''
        outgoingCall.callType = null
        outgoingCall.isConnecting = false
        outgoingCall.isConnected = false
        outgoingCall.error = null
    }

    const setOutgoingCallConnected = () => {
        outgoingCall.isConnecting = false
        outgoingCall.isConnected = true
        outgoingCall.error = null
    }

    const setOutgoingCallError = (error: string) => {
        outgoingCall.isConnecting = false
        outgoingCall.isConnected = false
        outgoingCall.error = error
    }

    return {
        darkMode,
        setDarkMode,
        windowWidth,
        isMobile,
        isPWAMode,
        checkPWAMode,
        // Push notifications
        notificationPermission,
        pushSubscription,
        isSubscribedToPush,
        pushSubscriptionId,
        requestNotificationPermission,
        ensureNotificationPermission,
        subscribeToPush,
        unsubscribeFromPush,
        loadUserSubscriptions,
        // Incoming call
        incomingCall,
        setIncomingCall,
        clearIncomingCall,
        setCallConnecting,
        setCallConnected,
        setCallError,
        // Outgoing call
        outgoingCall,
        setOutgoingCall,
        clearOutgoingCall,
        setOutgoingCallConnected,
        setOutgoingCallError,
    }
})
