import { type } from "@arktype/type";

export const EventTypingResponseSchema = type({
  status: "'ok' | 'error'",
});
export type EventTypingResponse = typeof EventTypingResponseSchema.infer;

export const ReadMessageResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type ReadMessageResponse = typeof ReadMessageResponseSchema.infer;

export const IncomingCallResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type IncomingCallResponse = typeof IncomingCallResponseSchema.infer;

export const AcceptCallResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type AcceptCallResponse = typeof AcceptCallResponseSchema.infer;

export const DeclineCallResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type DeclineCallResponse = typeof DeclineCallResponseSchema.infer;

export const WebrtcCallOfferResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcCallOfferResponse =
  typeof WebrtcCallOfferResponseSchema.infer;

export const WebrtcCallAnswerResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcCallAnswerResponse =
  typeof WebrtcCallAnswerResponseSchema.infer;

export const WebrtcIceCandidateResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcIceCandidateResponse =
  typeof WebrtcIceCandidateResponseSchema.infer;

export const WebrtcStartCallResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcStartCallResponse =
  typeof WebrtcStartCallResponseSchema.infer;

export const WebrtcCancelCallResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcCancelCallResponse =
  typeof WebrtcCancelCallResponseSchema.infer;

export const WebrtcCallEndResponseSchema = type({
  status: "'ok' | 'error'",
  message: "string",
});
export type WebrtcCallEndResponse = typeof WebrtcCallEndResponseSchema.infer;

export const WSErrorResponseSchema = type({
  status: "'error'",
  "message?": "string",
});
export type WSErrorResponse = typeof WSErrorResponseSchema.infer;

export const TestWsResponseSchema = type({
  status: "'ok'",
  message: "string",
});
export type TestWsResponse = typeof TestWsResponseSchema.infer;

export const WSSaveUserResponseSchema = type({
  status: "'ok'",
  user: {
    id: "number",
    name: "string",
    email: "string",
    "password?": "string",
  },
});
export type WSSaveUserResponse = typeof WSSaveUserResponseSchema.infer;
