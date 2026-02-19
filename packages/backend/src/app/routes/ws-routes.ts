import WSApiController from "#app/controllers/ws/ws-api-controller.js";
import { defineWsRoute } from "#vendor/utils/routing/define-ws-route.js";
import {
  ReadMessagesInputSchema,
  RegisterInputSchema,
  WSCallerIdPayloadSchema,
  WSEventTypingPayloadSchema,
  WSTargetUserIdPayloadSchema,
} from "shared/schemas";
import * as ResponseSchemas from "shared/responses";

export default [
  {
    group: [
      defineWsRoute({
        url: "event_typing",
        handler: WSApiController.eventTyping.bind(WSApiController),
        validator: WSEventTypingPayloadSchema,
        ResponseSchema: ResponseSchemas.EventTypingResponseSchema,
        description: "Handle typing events",
        rateLimit: {
          windowMs: 1 * 60 * 1000, // 1 minute
          maxRequests: 30, // Max 30 typing events per minute
        },
      }),
      defineWsRoute({
        url: "read_message",
        handler: WSApiController.readMessage.bind(WSApiController),
        ResponseSchema: ResponseSchemas.ReadMessageResponseSchema,
        validator: ReadMessagesInputSchema,
        description: "Handle read message events",
      }),
      defineWsRoute({
        url: "incoming_call",
        handler: WSApiController.incomingCall.bind(WSApiController),
        validator: WSEventTypingPayloadSchema,
        ResponseSchema: ResponseSchemas.IncomingCallResponseSchema,
        description: "Handle incoming call events",
      }),
      defineWsRoute({
        url: "accept_call",
        handler: WSApiController.acceptIncomingCall.bind(WSApiController),
        validator: WSCallerIdPayloadSchema,
        ResponseSchema: ResponseSchemas.AcceptCallResponseSchema,
        description: "Handle accept call events",
      }),
      defineWsRoute({
        url: "decline_call",
        handler: WSApiController.declineIncomingCall.bind(WSApiController),
        validator: WSCallerIdPayloadSchema,
        ResponseSchema: ResponseSchemas.DeclineCallResponseSchema,
        description: "Handle decline call events",
      }),
      defineWsRoute({
        url: "webrtc_call_offer",
        handler: WSApiController.webrtcCallOffer.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCallOfferResponseSchema,
        description: "Handle webrtc call offer events",
      }),
      defineWsRoute({
        url: "webrtc_call_answer",
        handler: WSApiController.webrtcCallAnswer.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCallAnswerResponseSchema,
        description: "Handle webrtc call answer events",
      }),
      defineWsRoute({
        url: "webrtc_ice_candidate",
        handler: WSApiController.webrtcIceCandidate.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcIceCandidateResponseSchema,
        description: "Handle webrtc ice candidate events",
      }),
      defineWsRoute({
        url: "start_call",
        handler: WSApiController.webrtcStartCall.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcStartCallResponseSchema,
        description: "Handle webrtc start call events",
      }),
      defineWsRoute({
        url: "cancel_call",
        handler: WSApiController.webrtcCancelCall.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCancelCallResponseSchema,
        description: "Handle webrtc cancel call events",
      }),
      defineWsRoute({
        url: "end_call",
        handler: WSApiController.webrtcCallEnd.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCallEndResponseSchema,
        description: "Handle webrtc call end events",
      }),
      defineWsRoute({
        url: "webrtc_call_end",
        handler: WSApiController.webrtcCallEnd.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCallEndResponseSchema,
        description: "Handle webrtc call end events",
      }),
      defineWsRoute({
        url: "webrtc_call_end_received",
        handler: WSApiController.webrtcCallEnd.bind(WSApiController),
        validator: WSTargetUserIdPayloadSchema,
        ResponseSchema: ResponseSchemas.WebrtcCallEndResponseSchema,
        description: "Handle webrtc call end events",
      }),
      defineWsRoute({
        url: "error",
        handler: WSApiController.error.bind(WSApiController),
        ResponseSchema: ResponseSchemas.WSErrorResponseSchema,
        middlewares: ["test2"],
        description: "Error handling test",
      }),
      defineWsRoute({
        url: "test-ws",
        handler: WSApiController.testWs.bind(WSApiController),
        ResponseSchema: ResponseSchemas.TestWsResponseSchema,
        description: "Test WebSocket",
      }),
      defineWsRoute({
        url: "save-user",
        handler: WSApiController.saveUser.bind(WSApiController),
        ResponseSchema: ResponseSchemas.WSSaveUserResponseSchema,
        validator: RegisterInputSchema,
        description: "Save user data",
        rateLimit: {
          windowMs: 5 * 60 * 1000, // 5 minutes
          maxRequests: 5, // Max 5 user save operations per 5 minutes
        },
      }),
    ],
    prefix: "main",
    description: "Main routes",
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 15 minutes
      maxRequests: 600, // Max 100 requests per 15 minutes for the whole group
    },
  },
];
