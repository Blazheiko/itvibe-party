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

export const wsService = {
    eventTyping(payload: WSEventTypingPayload) {
        broadcastService.broadcastMessageToUser(String(payload.contactId), 'event_typing', payload);
        return { status: 'ok' as const };
    },

    async readMessage(payload: ReadMessagesInput) {
        const userId = BigInt(payload.userId);
        const contactId = BigInt(payload.contactId);

        await Promise.all([
            messageRepository.markAllAsRead(userId, contactId),
            contactListRepository.resetUnreadCount(userId, contactId),
        ]);

        return { status: 'ok' as const, message: 'Read message event sent' };
    },

    incomingCall(payload: WSEventTypingPayload) {
        broadcastService.broadcastMessageToUser(String(payload.contactId), 'incoming_call', payload);
        return { status: 'ok' as const, message: 'Incoming call event sent' };
    },

    acceptIncomingCall(payload: WSCallerIdPayload) {
        broadcastService.broadcastMessageToUser(String(payload.callerId), 'accept_call', payload);
        return { status: 'ok' as const, message: 'Accept call event sent' };
    },

    declineIncomingCall(payload: WSCallerIdPayload) {
        broadcastService.broadcastMessageToUser(String(payload.callerId), 'decline_call', payload);
        return { status: 'ok' as const, message: 'Decline call event sent' };
    },

    webrtcCallOffer(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_offer',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc call offer event sent' };
    },

    webrtcCallAnswer(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_answer',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc call answer event sent' };
    },

    webrtcIceCandidate(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_ice_candidate',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc ice candidate event sent' };
    },

    webrtcStartCall(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_start_call',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc start call event sent' };
    },

    webrtcCallEnd(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_call_end',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc call end event sent' };
    },

    webrtcCancelCall(payload: WSTargetUserIdPayload) {
        broadcastService.broadcastMessageToUser(
            String(payload.targetUserId),
            'webrtc_cancel_call',
            payload,
        );
        return { status: 'ok' as const, message: 'Webrtc cancel call event sent' };
    },

    testWs() {
        return { status: 'ok' as const, message: 'testWs' };
    },

    async saveUser(payload: RegisterInput) {
        const user = await userRepository.create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });

        return {
            status: 'ok' as const,
            user: userTransformer.serialize(user),
        };
    },
};
