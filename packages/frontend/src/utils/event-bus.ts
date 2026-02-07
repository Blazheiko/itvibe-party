import mitt from 'mitt'
import type { ApiMessage } from '@/views/Chat.vue'

export type Events = {
    user_online: { userId: number; isOnline: boolean }
    new_message: { message: ApiMessage }
    event_typing: { userId: number; contactId: number }
    change_online: { userId: number; status: string }
    toggle_notifications: { enabled: boolean }
    init_app: void
    unauthorized: void
    destroy_websocket_base: void
    webrtc_ice_candidate: { candidate: RTCIceCandidateInit; targetUserId: string | number }
    webrtc_call_answer: { answer: RTCSessionDescriptionInit; targetUserId: string | number }
    webrtc_call_offer: {
        targetUserId: string | number
        callType: 'video' | 'audio'
        offer: RTCSessionDescriptionInit
    }
    webrtc_start_call: {
        targetUserId: string | number
        callType: 'video' | 'audio'
    }
    webrtc_local_stream_updated: { stream: MediaStream | null }
    webrtc_remote_stream_updated: { stream: MediaStream | null }
    webrtc_streams_cleared: Record<string, never>
    webrtc_answer_received: { answer: RTCSessionDescriptionInit }
    webrtc_candidate_received: { candidate: RTCIceCandidateInit }
    webrtc_connection_state_changed: {
        state: string
        isConnecting: boolean
        isConnected: boolean
        error?: string | null
    }
    webrtc_call_end: {
        targetUserId: string | number
        reason?: string
    }
    webrtc_call_end_received: {
        targetUserId: string | number
        reason?: string
    }
}

const emitter = mitt<Events>()

export const useEventBus = () => emitter

// export const useEventBus = () => {
//     return {
//         emit: emitter.emit,
//         on: emitter.on,
//         off: emitter.off,
//     }
// }
