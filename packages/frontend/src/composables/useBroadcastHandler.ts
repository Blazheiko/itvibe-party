// src/composables/useBroadcastHandler.ts
import { useEventBus } from '@/utils/event-bus'
import { useContactsStore } from '@/stores/contacts'
import { useStateStore } from '@/stores/state'
import { useUserStore } from '@/stores/user'
import type { WebsocketMessage } from '@/utils/websocket-base'
import type { ApiMessage } from '@/views/Chat.vue'

export const useBroadcastHandler = () => {
    const eventBus = useEventBus()
    const contactsStore = useContactsStore()
    const stateStore = useStateStore()
    const userStore = useUserStore()

    // Обработчики событий
    const eventHandler = {
        user_online: (event: WebsocketMessage) => {
            console.log('user_online')
            eventBus.emit('user_online', event.payload as { userId: number; isOnline: boolean })
        },
        new_message: (event: WebsocketMessage) => {
            console.log('new_message')
            eventBus.emit('new_message', event.payload as { message: ApiMessage })
        },
        event_typing: (event: WebsocketMessage) => {
            console.log('event_typing')
            eventBus.emit('event_typing', event.payload as { userId: number; contactId: number })
        },
        change_online: (event: WebsocketMessage) => {
            console.log('change_online', event.payload)
            contactsStore.updateContactById(String(event.payload.userId), {
                isOnline: event.payload.status === 'online',
            })
        },
        accept_call: (event: WebsocketMessage) => {
            console.log('accept_call', event.payload)
            stateStore.clearIncomingCall()
        },
        decline_call: (event: WebsocketMessage) => {
            console.log('decline_call', event.payload)
            stateStore.clearIncomingCall()
        },
        webrtc_call_offer: async (event: WebsocketMessage) => {
            console.log('webrtc_call_offer', event.payload)
            const payload = event.payload as {
                offer: RTCSessionDescriptionInit
                callType: 'video' | 'audio'
                callerId: string | number
                callerName: string
            }

            // Сохраняем offer и показываем входящий звонок
            // VideoCallModal обработает offer через useWebRTC
            stateStore.setIncomingCall({
                callerId: payload.callerId,
                callerName: payload.callerName,
                callType: payload.callType,
                offer: payload.offer,
            })
        },
        webrtc_call_answer: (event: WebsocketMessage) => {
            console.log('webrtc_call_answer', event.payload)
            const payload = event.payload as { answer: RTCSessionDescriptionInit }

            // Передаем событие через event bus для обработки в useWebRTC
            eventBus.emit('webrtc_answer_received', {
                answer: payload.answer,
            })
        },
        webrtc_ice_candidate: (event: WebsocketMessage) => {
            console.log('webrtc_ice_candidate', event.payload)
            const payload = event.payload as { candidate: RTCIceCandidateInit }

            // Передаем событие через event bus для обработки в useWebRTC
            eventBus.emit('webrtc_candidate_received', {
                candidate: payload.candidate,
            })
        },
        webrtc_call_end: (event: WebsocketMessage) => {
            console.log('webrtc_call_end received from WebSocket', event.payload)
            const payload = event.payload as {
                callerId: string | number
                reason?: string
            }

            // Игнорируем свои собственные события завершения звонка
            if (payload.callerId === userStore.user?.id) {
                console.log('Ignoring own webrtc_call_end event')
                return
            }

            // Используем отдельное событие для полученных извне событий завершения
            // чтобы избежать циклической отправки
            eventBus.emit('webrtc_call_end_received', {
                targetUserId: payload.callerId,
                reason: payload.reason || 'call_ended',
            })

            // НЕ очищаем состояние здесь - это должен делать VideoCallModal
            // после корректного завершения звонка
        },
    }

    // Основная функция обработки broadcast событий
    const handleBroadcast = (data: WebsocketMessage) => {
        console.log('handleBroadcast')
        console.log(data)
        const event = data.event.split(':')[1]
        if (event in eventHandler) {
            eventHandler[event as keyof typeof eventHandler](data)
        } else {
            console.error('Unknown event:', event)
        }
    }

    return {
        handleBroadcast,
        eventHandler,
    }
}
