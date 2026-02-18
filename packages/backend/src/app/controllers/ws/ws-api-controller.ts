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
import type {
    EventTypingResponse,
    ReadMessageResponse,
    IncomingCallResponse,
    AcceptCallResponse,
    DeclineCallResponse,
    WebrtcCallOfferResponse,
    WebrtcCallAnswerResponse,
    WebrtcIceCandidateResponse,
    WebrtcStartCallResponse,
    WebrtcCallEndResponse,
    WebrtcCancelCallResponse,
    TestWsResponse,
    WSSaveUserResponse,
    WSErrorResponse,
} from 'shared';

export default {
    eventTyping({ wsData }: WsContext<WSEventTypingPayload>): EventTypingResponse {
        return wsService.eventTyping(wsData.payload as WSEventTypingPayload);
    },

    async readMessage({ wsData }: WsContext<ReadMessagesInput>): Promise<ReadMessageResponse> {
        logger.info('ws readMessage');
        return wsService.readMessage(wsData.payload as ReadMessagesInput);
    },

    async incomingCall({ wsData }: WsContext<WSEventTypingPayload>): Promise<IncomingCallResponse> {
        return wsService.incomingCall(wsData.payload as WSEventTypingPayload);
    },

    async acceptIncomingCall({ wsData }: WsContext<WSCallerIdPayload>): Promise<AcceptCallResponse> {
        return wsService.acceptIncomingCall(wsData.payload as WSCallerIdPayload);
    },

    async declineIncomingCall({ wsData }: WsContext<WSCallerIdPayload>): Promise<DeclineCallResponse> {
        return wsService.declineIncomingCall(wsData.payload as WSCallerIdPayload);
    },

    async webrtcCallOffer({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcCallOfferResponse> {
        return wsService.webrtcCallOffer(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCallAnswer({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcCallAnswerResponse> {
        return wsService.webrtcCallAnswer(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcIceCandidate({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcIceCandidateResponse> {
        return wsService.webrtcIceCandidate(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcStartCall({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcStartCallResponse> {
        return wsService.webrtcStartCall(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCallEnd({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcCallEndResponse> {
        logger.info('ws webrtcCallEnd');
        return wsService.webrtcCallEnd(wsData.payload as WSTargetUserIdPayload);
    },

    async webrtcCancelCall({ wsData }: WsContext<WSTargetUserIdPayload>): Promise<WebrtcCancelCallResponse> {
        logger.info('ws webrtcCancelCall');
        return wsService.webrtcCancelCall(wsData.payload as WSTargetUserIdPayload);
    },

    error(): WSErrorResponse {
        logger.info('ws error');
        throw new Error('Test error');
    },

    testWs(): TestWsResponse {
        logger.info('ws testWs');
        return wsService.testWs();
    },

    async saveUser({ wsData }: WsContext<RegisterInput>): Promise<WSSaveUserResponse> {
        logger.info('ws saveUser');
        return (await wsService.saveUser(
            wsData.payload as RegisterInput,
        )) as WSSaveUserResponse;
    },
};
