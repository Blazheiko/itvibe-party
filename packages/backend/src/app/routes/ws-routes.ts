import WSApiController from '#app/controllers/ws/ws-api-controller.js';
import { defineWsRoute } from '#vendor/utils/routing/define-ws-route.js';

export default [
    {
        group: [
            defineWsRoute({
                url: 'event_typing',
                handler: WSApiController.eventTyping,
                typeResponse: 'WSApiController.EventTypingResponse',
                ResponseSchema: 'WSApiController.EventTypingResponse',
                description: 'Handle typing events',
                rateLimit: {
                    windowMs: 1 * 60 * 1000, // 1 minute
                    maxRequests: 30,  // Max 30 typing events per minute
                },
            }),
            defineWsRoute({
                url: 'read_message',
                handler: WSApiController.readMessage,
                typeResponse: 'WSApiController.ReadMessageResponse',
                ResponseSchema: 'WSApiController.ReadMessageResponse',
                validator: 'readMessages',
                description: 'Handle read message events',
            }),
            defineWsRoute({
                url: 'incoming_call',
                handler: WSApiController.incomingCall,
                typeResponse: 'WSApiController.IncomingCallResponse',
                ResponseSchema: 'WSApiController.IncomingCallResponse',
                description: 'Handle incoming call events',
            }),
            defineWsRoute({
                url: 'accept_call',
                handler: WSApiController.acceptIncomingCall,
                typeResponse: 'WSApiController.AcceptCallResponse',
                ResponseSchema: 'WSApiController.AcceptCallResponse',
                description: 'Handle accept call events',
            }),
            defineWsRoute({
                url: 'decline_call',
                handler: WSApiController.declineIncomingCall,
                typeResponse: 'WSApiController.DeclineCallResponse',
                ResponseSchema: 'WSApiController.DeclineCallResponse',
                description: 'Handle decline call events',
            }),
            defineWsRoute({
                url: 'webrtc_call_offer',
                handler: WSApiController.webrtcCallOffer,
                typeResponse: 'WSApiController.WebrtcCallOfferResponse',
                ResponseSchema: 'WSApiController.WebrtcCallOfferResponse',
                description: 'Handle webrtc call offer events',
            }),
            defineWsRoute({
                url: 'webrtc_call_answer',
                handler: WSApiController.webrtcCallAnswer,
                typeResponse: 'WSApiController.WebrtcCallAnswerResponse',
                ResponseSchema: 'WSApiController.WebrtcCallAnswerResponse',
                description: 'Handle webrtc call answer events',
            }),
            defineWsRoute({
                url: 'webrtc_ice_candidate',
                handler: WSApiController.webrtcIceCandidate,
                typeResponse: 'WSApiController.WebrtcIceCandidateResponse',
                ResponseSchema: 'WSApiController.WebrtcIceCandidateResponse',
                description: 'Handle webrtc ice candidate events',
            }),
            defineWsRoute({
                url: 'start_call',
                handler: WSApiController.webrtcStartCall,
                typeResponse: 'WSApiController.WebrtcStartCallResponse',
                ResponseSchema: 'WSApiController.WebrtcStartCallResponse',
                description: 'Handle webrtc start call events',
            }),
            defineWsRoute({
                url: 'cancel_call',
                handler: WSApiController.webrtcCancelCall,
                typeResponse: 'WSApiController.WebrtcCancelCallResponse',
                ResponseSchema: 'WSApiController.WebrtcCancelCallResponse',
                description: 'Handle webrtc cancel call events',
            }),
            defineWsRoute({
                url: 'end_call',
                handler: WSApiController.webrtcCallEnd,
                typeResponse: 'WSApiController.WebrtcCallEndResponse',
                ResponseSchema: 'WSApiController.WebrtcCallEndResponse',
                description: 'Handle webrtc call end events',
            }),
            defineWsRoute({
                url: 'webrtc_call_end',
                handler: WSApiController.webrtcCallEnd,
                typeResponse: 'WSApiController.WebrtcCallEndResponse',
                ResponseSchema: 'WSApiController.WebrtcCallEndResponse',
                description: 'Handle webrtc call end events',
            }),
            defineWsRoute({
                url: 'webrtc_call_end_received',
                handler: WSApiController.webrtcCallEnd,
                typeResponse: 'WSApiController.WebrtcCallEndResponse',
                ResponseSchema: 'WSApiController.WebrtcCallEndResponse',
                description: 'Handle webrtc call end events',
            }),
            defineWsRoute({
                url: 'error',
                handler: WSApiController.error,
                typeResponse: 'WSApiController.ErrorResponse',
                ResponseSchema: 'WSApiController.ErrorResponse',
                middlewares: ['test2'],
                description: 'Error handling test',
            }),
            defineWsRoute({
                url: 'test-ws',
                handler: WSApiController.testWs,
                typeResponse: 'WSApiController.TestWsResponse',
                ResponseSchema: 'WSApiController.TestWsResponse',
                description: 'Test WebSocket',
            }),
            defineWsRoute({
                url: 'save-user',
                handler: WSApiController.saveUser,
                typeResponse: 'WSApiController.SaveUserResponse',
                ResponseSchema: 'WSApiController.SaveUserResponse',
                validator: 'register',
                description: 'Save user data',
                rateLimit: {
                    windowMs: 5 * 60 * 1000, // 5 minutes
                    maxRequests: 5, // Max 5 user save operations per 5 minutes
                },
            }),
        ],
        prefix: 'main',
        description: 'Main routes',
        rateLimit: {
            windowMs: 1 * 60 * 1000, // 15 minutes
            maxRequests: 600, // Max 100 requests per 15 minutes for the whole group
        },
    },
];
