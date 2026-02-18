import logger from '#logger';
import type { WsContext } from '#vendor/types/types.js';
import { wsService } from '#app/services/ws-service.js';
import type {
    ReadMessagesInput,
    RegisterInput,
    WSCallerIdPayload,
    WSEventTypingPayload,
    WSTargetUserIdPayload,
} from 'shared/schemas';

export default {
    eventTyping({ wsData }: WsContext<WSEventTypingPayload>) {
        return wsService.eventTyping(wsData.payload as WSEventTypingPayload);
    },

    async readMessage({ wsData }: WsContext<ReadMessagesInput>) {
        logger.info('ws readMessage');
        return wsService.readMessage(wsData.payload as ReadMessagesInput);
    },

    async incomingCall({ wsData }: WsContext<WSEventTypingPayload>) {
        return wsService.incomingCall(wsData.payload as WSEventTypingPayload);
    },

    async acceptIncomingCall({ wsData }: WsContext<WSCallerIdPayload>) {
        return wsService.acceptIncomingCall(wsData.payload as WSCallerIdPayload);
    },

    async declineIncomingCall({ wsData }: WsContext<WSCallerIdPayload>) {
        return wsService.declineIncomingCall(wsData.payload as WSCallerIdPayload);
    },

    async webrtcCallOffer({ wsData }: WsContext<WSTargetUserIdPayload>) {
        return wsService.webrtcCallOffer(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCallAnswer({ wsData }: WsContext<WSTargetUserIdPayload>) {
        return wsService.webrtcCallAnswer(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcIceCandidate({ wsData }: WsContext<WSTargetUserIdPayload>) {
        return wsService.webrtcIceCandidate(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcStartCall({ wsData }: WsContext<WSTargetUserIdPayload>) {
        return wsService.webrtcStartCall(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCallEnd({ wsData }: WsContext<WSTargetUserIdPayload>) {
        logger.info('ws webrtcCallEnd');
        return wsService.webrtcCallEnd(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCancelCall({ wsData }: WsContext<WSTargetUserIdPayload>) {
        logger.info('ws webrtcCancelCall');
        return wsService.webrtcCancelCall(wsData.payload as WSTargetUserIdPayload);
    },

    error() {
        logger.info('ws error');
        throw new Error('Test error');
    },

    testWs() {
        logger.info('ws testWs');
        return wsService.testWs();
    },

    async saveUser({ wsData }: WsContext<RegisterInput>) {
        logger.info('ws saveUser');
        return wsService.saveUser(wsData.payload as RegisterInput);
    },
};
