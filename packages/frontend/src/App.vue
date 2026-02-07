<script setup lang="ts">
// Главный компонент приложения
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import { useStateStore } from '@/stores/state'
// import { useAppInitialization } from '@/composables/useAppInitialization'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import type { User } from '@/stores/user'
import { useContactsStore } from '@/stores/contacts'
import { useMessagesStore } from '@/stores/messages'
import baseApi from '@/utils/base-api'
import { useEventBus } from '@/utils/event-bus'
import AppHeader from '@/components/AppHeader.vue'
import VideoCallModal from '@/components/VideoCallModal.vue'
import { useWebSocketConnection } from '@/composables/useWebSocketConnection'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isLoading = ref(true)

const stateStore = useStateStore()
const contactsStore = useContactsStore()
const messagesStore = useMessagesStore()
const eventBus = useEventBus()
const { websocketClose, websocketOpen } = useWebSocketConnection()

// Объявляем функции заранее
const onReauthorize = async () => {
    console.error('onReauthorize')
    websocketClose()
    userStore.clearUser()
    router.push('/')
}

const destroyWebsocketBase = () => {
    console.log('destroyWebsocketBase')
    websocketClose()
}



const windowWidth = stateStore.windowWidth

// Обработчики WebRTC событий из event bus
const handleWebRTCIceCandidate = (data: {
    candidate: RTCIceCandidateInit
    targetUserId: string | number
}) => {
    console.log('WebRTC ICE candidate event:', data)
    // Отправляем ICE candidate через WebSocket с targetUserId
    baseApi.ws('main/webrtc_ice_candidate', {
        candidate: data.candidate,
        targetUserId: data.targetUserId,
    })
}

const handleWebRTCCallAnswer = (data: {
    answer: RTCSessionDescriptionInit
    targetUserId: string | number
}) => {
    console.log('WebRTC call answer event:', data)
    // Отправляем answer через WebSocket с targetUserId
    baseApi.ws('main/webrtc_call_answer', {
        answer: data.answer,
        targetUserId: data.targetUserId,
    })
}

const handleWebRTCCallOffer = (data: {
    targetUserId: string | number
    callType: 'video' | 'audio'
    offer: RTCSessionDescriptionInit
}) => {
    console.log('WebRTC call offer event:', data)
    // Отправляем offer через WebSocket
    baseApi.ws('main/webrtc_call_offer', {
        targetUserId: data.targetUserId,
        callType: data.callType,
        offer: data.offer,
        callerId: userStore.user?.id,
        callerName: userStore.user?.name,
    })
}

const handleWebRTCCallEnd = (data: { targetUserId: string | number; reason?: string }) => {
    console.log('WebRTC call end event:', data)
    // Отправляем событие завершения звонка через WebSocket
    baseApi.ws('main/webrtc_call_end', {
        targetUserId: data.targetUserId,
        reason: data.reason || 'call_ended',
        callerId: userStore.user?.id,
        callerName: userStore.user?.name,
    })
}

// Вычисляем, нужно ли показывать кнопку переключения темы
const showThemeToggle = computed(() => {
    // Скрываем кнопку на странице чата в мобильной версии
    if ((route.name === 'Chat' || route.name === 'UserAccount') && windowWidth <= 1400) {
        return false
    }
    return true
})

// Пропсы для глобального хедера из meta маршрута
const headerTitle = computed(() => (route.meta.title as string) || '')
const headerBackPath = computed(() => (route.meta.backPath as string) || '')
const headerBackLabel = computed(() => (route.meta.backLabel as string) || 'Back')

// Обработчик изменения размера окна
// const handleResize = () => {
//     windowWidth.value = window.innerWidth
// }

// Определяем тему при загрузке приложения
onMounted(async () => {
    // Добавляем слушатель изменения размера окна
    // window.addEventListener('resize', handleResize)

    // Слушаем изменения предпочтений системы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        stateStore.setDarkMode(e.matches)
        // if (localStorage.getItem('theme') === null) {
        //     stateStore.setDarkMode(e.matches)
        // }
    })

    // Инициализация данных при загрузке приложения

    // Инициализация контактов
    contactsStore.resetContacts()

    // Инициализация сообщений
    messagesStore.resetMessages()

    await initializeApp()
    isLoading.value = false
    eventBus.on('init_app', initializeApp)
    eventBus.on('unauthorized', onReauthorize)
    eventBus.on('destroy_websocket_base', destroyWebsocketBase)

    // Отслеживаем изменения состояния WebRTC
    eventBus.on('webrtc_ice_candidate', handleWebRTCIceCandidate)
    eventBus.on('webrtc_call_answer', handleWebRTCCallAnswer)
    eventBus.on('webrtc_call_offer', handleWebRTCCallOffer)
    eventBus.on('webrtc_call_end', handleWebRTCCallEnd)
    eventBus.on('webrtc_start_call', handleStartCall)
})

// Удаляем слушатель при размонтировании компонента
onBeforeUnmount(() => {
    // window.removeEventListener('resize', handleResize)
    eventBus.off('init_app', initializeApp)
    eventBus.off('unauthorized', onReauthorize)
    eventBus.off('webrtc_ice_candidate', handleWebRTCIceCandidate)
    eventBus.off('webrtc_call_answer', handleWebRTCCallAnswer)
    eventBus.off('webrtc_call_offer', handleWebRTCCallOffer)
    eventBus.off('webrtc_call_end', handleWebRTCCallEnd)
    eventBus.off('webrtc_start_call', handleStartCall)
    eventBus.off('destroy_websocket_base', destroyWebsocketBase)
})

// interface UserOnlineData {
//     userId: number
//     isOnline: boolean
// }

// interface NewMessageData {
//     contactId: number
//     content: string
// }

// Обработка broadcast событий теперь происходит в useBroadcastHandler composable

// let websocketBase: WebsocketBase | null = null

const initializeApp = async () => {
    try {
        const { data, error } = await baseApi.http('GET', '/api/main/init')
        console.log(data)

        if (error) {
            console.error('Error in initialization:', error)
            return null
        } else if (data && data.status === 'ok' && data.user && data.wsUrl) {
            userStore.setUser(data.user as User)
            if (route.name !== 'JoinChat') router.push({ name: 'Chat' })

            console.log('Data in initialization:')

            // websocketBase = new WebsocketBase(data.wsUrl as string, {
            //     callbacks: {
            //       onReauthorize,
            //       onBroadcast,
            //       onConnectionClosed: destroyWebsocketBase
            //     },
            // })
            // initialize(data.wsUrl as string)
            websocketOpen(data.wsUrl as string)

            // baseApi.setWebSocketClient(websocketBase)
        } else if (data && data.status === 'unauthorized' && route.name !== 'JoinChat') {
            userStore.setUser(null as unknown as User)
            router.push({ name: 'Login' })
        }
    } catch (error) {
        console.error('Error in initialization:', error)
    }
}

// Переключение темы
const toggleTheme = () => {
    stateStore.setDarkMode(!stateStore.darkMode)
}

// Обработка входящего звонка
const handleAcceptCall = () => {
    console.log('Call accepted, VideoCallModal will handle WebRTC connection')
    // Отправляем WebSocket сообщение о принятии звонка
    if (stateStore.incomingCall.callerId) {
        baseApi.ws('main/accept_call', {
            callerId: stateStore.incomingCall.callerId,
            callType: stateStore.incomingCall.callType,
            callerName: stateStore.incomingCall.callerName,
        })
    }
    // VideoCallModal сам управляет WebRTC соединением
}

const handleDeclineCall = () => {
    console.log('Call declined:', stateStore.incomingCall)
    // Отправляем WebSocket сообщение об отклонении звонка через унифицированное событие
    if (stateStore.incomingCall.callerId) {
        baseApi.ws('main/webrtc_call_end', {
            targetUserId: stateStore.incomingCall.callerId,
            reason: 'call_declined',
            callerId: userStore.user?.id,
            callerName: userStore.user?.name,
        })
    }
    stateStore.clearIncomingCall()
}

const handleCancelConnection = () => {
    console.log('Connection cancelled:', stateStore.incomingCall)

    // Отправляем WebSocket сообщение об отмене соединения через унифицированное событие
    if (stateStore.incomingCall.callerId) {
        baseApi.ws('main/webrtc_call_end', {
            targetUserId: stateStore.incomingCall.callerId,
            reason: 'connection_cancelled',
            callerId: userStore.user?.id,
            callerName: userStore.user?.name,
        })
    }

    // Очищаем состояние звонка
    stateStore.clearIncomingCall()
}

// Функция для начала исходящего звонка
const handleStartCall = async (data: {
    callType: 'video' | 'audio'
    targetUserId: string | number
}) => {
    const { callType, targetUserId } = data
    console.log('Starting outgoing call:', { callType, targetUserId })

    try {
        // Находим контакт для получения имени
        const contact = contactsStore.getContactById(String(targetUserId))
        const targetName = contact?.name || 'Unknown'

        // Устанавливаем состояние исходящего звонка
        stateStore.setOutgoingCall({
            targetUserId,
            targetName,
            callType,
        })

        // НЕ отправляем WebSocket сообщение сразу!
        // VideoCallModal сам отправит webrtc_call_offer когда видео будет готово
        console.log(
            'Outgoing call initiated, VideoCallModal will prepare media and send offer when ready',
        )
    } catch (error) {
        console.error('Failed to start call:', error)
        stateStore.setOutgoingCallError('Failed to start call')
    }
}

// Функция для завершения исходящего звонка
const handleEndOutgoingCall = () => {
    console.log('Ending outgoing call')

    // Отправляем WebSocket сообщение о завершении звонка через WebRTC событие
    if (stateStore.outgoingCall.targetUserId) {
        // Используем унифицированное событие webrtc_call_end
        baseApi.ws('main/webrtc_call_end', {
            targetUserId: stateStore.outgoingCall.targetUserId,
            reason: 'call_ended_by_caller',
            callerId: userStore.user?.id,
            callerName: userStore.user?.name,
        })
    }

    // Очищаем состояние исходящего звонка
    stateStore.clearOutgoingCall()
}
</script>

<template>
    <div class="app-container">
        <div v-if="isLoading" class="loader-container">
            <div class="loader"></div>
            <p>Loading...</p>
        </div>
        <template v-else>
            <AppHeader
                v-if="userStore.user"
                :title="headerTitle"
                :back-path="headerBackPath"
                :back-label="headerBackLabel"
            />
            <div v-if="showThemeToggle" class="theme-toggle">
                <button @click="toggleTheme">
                    {{ stateStore.darkMode ? '☀️' : '🌙' }}
                </button>
            </div>
            <router-view />
        </template>

        <!-- Глобальное модальное окно для входящих звонков -->
        <VideoCallModal
            v-if="stateStore.incomingCall.isActive"
            :caller-name="stateStore.incomingCall.callerName"
            :caller-id="stateStore.incomingCall.callerId!"
            :call-type="stateStore.incomingCall.callType!"
            :offer="stateStore.incomingCall.offer!"
            @accept-call="handleAcceptCall"
            @decline-call="handleDeclineCall"
            @cancel-connection="handleCancelConnection"
            @call-ended="handleDeclineCall"
        />

        <!-- Глобальное модальное окно для исходящих звонков -->
        <VideoCallModal
            v-if="stateStore.outgoingCall.isActive"
            :caller-name="stateStore.outgoingCall.targetName"
            :caller-id="stateStore.outgoingCall.targetUserId!"
            :call-type="stateStore.outgoingCall.callType!"
            :is-outgoing="true"
            @decline-call="handleEndOutgoingCall"
            @cancel-connection="handleEndOutgoingCall"
            @call-ended="handleEndOutgoingCall"
        />
    </div>
</template>

<style>
:root {
    --primary-color: #145fc2;
    --accent-color: #195cc6;
    --background-color: #f8f9fa;
    --text-color: #212529;
    --border-color: #dee2e6;
    --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
    --content-max-width: 800px;
    --header-height: 36px;
    /* Цвета индикаторов: календарь и задачи */
    --calendar-color: #ff3b30; /* оттенок красного, как в календаре */
    --task-color: #4caf50; /* зеленый как в task manager */
}

:root.dark-theme {
    --primary-color: #0d47a1;
    --accent-color: #0d47a1;
    --background-color: #121212;
    --text-color: #e0e0e0;
    --border-color: #424242;
    --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    --calendar-color: #ff6b6b;
    --task-color: #66bb6a;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    overscroll-behavior: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

body {
    font-family:
        'Inter',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        Helvetica,
        Arial,
        sans-serif,
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol';
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-size: 16px;
}

#app {
    height: 100%;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

button {
    font-family: inherit;
}

a {
    color: var(--primary-color);
    text-decoration: none;
}

h1,
h2,
h3,
h4,
h5,
h6 {
    font-weight: 600;
    line-height: 1.3;
}

img,
svg {
    max-width: 100%;
    height: auto;
}

textarea,
input {
    font-family: inherit;
    font-size: inherit;
}

/* Глобальные утилитарные классы */
.container {
    width: 100%;
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 0 20px;
}

@media (max-width: 768px) {
    :root {
        --content-max-width: 100%;
        --header-height: 32px;
    }

    body {
        font-size: 15px;
    }

    .container {
        padding: 0 16px;
    }

    h1 {
        font-size: 24px;
    }

    h2 {
        font-size: 20px;
    }

    h3 {
        font-size: 18px;
    }
}

.theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999;
}

.theme-toggle button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 8px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dark-theme .theme-toggle button {
    background-color: rgba(255, 255, 255, 0.1);
}

.theme-toggle button:hover {
    background-color: rgba(0, 0, 0, 0.2);
}

.dark-theme .theme-toggle button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Изменение позиции кнопки темы на мобильных устройствах */
@media (max-width: 1400px) {
    .theme-toggle {
        top: auto;
        bottom: 20px;
        right: 20px;
    }
}

.loader-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--background-color);
    z-index: 9999;
}

.loader {
    width: 48px;
    height: 48px;
    border: 5px solid var(--primary-color);
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
    margin-bottom: 16px;
}

.loader-container p {
    color: var(--text-color);
    font-size: 18px;
    font-weight: 500;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
