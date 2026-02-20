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
import { mainApi } from '@/utils/api'
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
        const { data, error } = await mainApi.init()
        console.log(data)

        if (error) {
            console.error('Error in initialization:', error)
            return null
        } else if (data && data.status === 'ok' && data.user && data.wsUrl) {
            userStore.setUser(data.user as User)
            stateStore.setNotesStorageConfig({
                s3Endpoint: data.storage?.s3Endpoint ?? '',
                s3Bucket: data.storage?.s3Bucket ?? '',
                s3Prefix: data.storage?.s3Prefix ?? '',
                s3StaticDataPrefix: data.storage?.s3StaticDataPrefix ?? '',
                s3DynamicDataPrefix: data.storage?.s3DynamicDataPrefix ?? '',
            })
            if (route.name !== 'JoinChat') router.push({ name: 'Chat' })

            console.log('Data in initialization:')

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
    --primary-color: #2563eb; /* Tailwind blue-600 */
    --accent-color: #3b82f6; /* Tailwind blue-500 */
    --background-color: #f8fafc; /* Tailwind slate-50 */
    --surface-color: #ffffff;
    --text-color: #0f172a; /* Tailwind slate-900 */
    --text-secondary: #64748b; /* Tailwind slate-500 */
    --border-color: #e2e8f0; /* Tailwind slate-200 */
    --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --border-radius: 12px;
    --content-max-width: 800px;
    --header-height: 56px;
    /* Цвета индикаторов: календарь и задачи */
    --calendar-color: #ef4444; /* Tailwind red-500 */
    --task-color: #22c55e; /* Tailwind green-500 */
    --glass-bg: rgba(255, 255, 255, 0.8);
    --glass-border: rgba(255, 255, 255, 0.3);
    --app-header-bg: #1e40af; /* Tailwind blue-800 - slightly darker than primary to separate from chat */
}

:root.dark-theme {
    --primary-color: #3b82f6; /* Tailwind blue-500 */
    --accent-color: #60a5fa; /* Tailwind blue-400 */
    --background-color: #0f172a; /* Tailwind slate-900 */
    --surface-color: #1e293b; /* Tailwind slate-800 */
    --text-color: #f8fafc; /* Tailwind slate-50 */
    --text-secondary: #94a3b8; /* Tailwind slate-400 */
    --border-color: #334155; /* Tailwind slate-700 */
    --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --calendar-color: #f87171; /* Tailwind red-400 */
    --task-color: #4ade80; /* Tailwind green-400 */
    --glass-bg: rgba(30, 41, 59, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
    --app-header-dark-bg: rgba(15, 23, 42, 0.85); /* Slightly darker glass for app header */
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    height: 100dvh;
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
    height: 100dvh;
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
        --header-height: 48px;
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
