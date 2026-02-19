import type {
    ReadMessagesInput,
    RegisterInput,
    WSCallerIdPayload,
    WSEventTypingPayload,
    WSTargetUserIdPayload,
} from 'shared/schemas';
import { broadcastService } from '#app/services/broadcast-service.js';
import { contactListRepository, messageRepository, userRepository } from '#app/repositories/index.js';
import { userTransformer } from '#app/transformers/index.js';

interface WsStatusResponse {
    status: 'ok';
    message: string;
}

export const wsService = {
    eventTyping(payload: WSEventTypingPayload): { status: 'ok' } {
        broadcastService.broadcastMessageToUser(String(payload.contactId), 'event_typing', payload);
        return { status: 'ok' };
    },

    async readMessage(payload: ReadMessagesInput): Promise<WsStatusResponse> {
        const userId = BigInt(payload.userId);
        const contactId = BigInt(payload.contactId);

        await Promise.all([
            messageRepository.markAllAsRead(userId, contactId),
            contactListRepository.resetUnreadCount(userId, contactId),
        ]);

        return { status: 'ok', message: 'Read message event sent' };
    },

    incomingCall(payload: WSEventTypingPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(String(payload.contactId), 'incoming_call', payload);
        return { status: 'ok', message: 'Incoming call event sent' };
    },

    acceptIncomingCall(payload: WSCallerIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(String(payload.callerId), 'accept_call', payload);
        return { status: 'ok', message: 'Accept call event sent' };
    },

    declineIncomingCall(payload: WSCallerIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(String(payload.callerId), 'decline_call', payload);
        return { status: 'ok', message: 'Decline call event sent' };
    },

    webrtcCallOffer(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_offer',
            payload,
        );
        return { status: 'ok', message: 'Webrtc call offer event sent' };
    },

    webrtcCallAnswer(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_answer',
            payload,
        );
        return { status: 'ok', message: 'Webrtc call answer event sent' };
    },

    webrtcIceCandidate(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_ice_candidate',
            payload,
        );
        return { status: 'ok', message: 'Webrtc ice candidate event sent' };
    },

    webrtcStartCall(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_start_call',
            payload,
        );
        return { status: 'ok', message: 'Webrtc start call event sent' };
    },

    webrtcCallEnd(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_end',
            payload,
        );
        return { status: 'ok', message: 'Webrtc call end event sent' };
    },

    webrtcCancelCall(payload: WSTargetUserIdPayload): WsStatusResponse {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_cancel_call',
            payload,
        );
        return { status: 'ok', message: 'Webrtc cancel call event sent' };
    },

    testWs(): WsStatusResponse {
        return { status: 'ok', message: 'testWs' };
    },

    async saveUser(
        payload: RegisterInput,
    ): Promise<{ status: 'ok'; user: ReturnType<typeof userTransformer.serialize> }> {
        const user = await userRepository.create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });

        return {
            status: 'ok',
            user: userTransformer.serialize(user),
        };
    },
};
