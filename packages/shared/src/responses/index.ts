import { type } from "@arktype/type";

export const BaseResponseSchema = type({
  status: "string",
});
export type BaseResponse = typeof BaseResponseSchema.infer;

export const ErrorResponseSchema = type({
  status: "'error' | 'unauthorized'",
  message: "string",
});
export type ErrorResponse = typeof ErrorResponseSchema.infer;

export const SuccessResponseSchema = type({
  status: "'ok'",
  "data?": "unknown",
});
export type SuccessResponse = typeof SuccessResponseSchema.infer;

export * from "./main-controller.js";
export * from "./auth-controller.js";
export * from "./chat-list-controller.js";
export * from "./invitation-controller.js";
export * from "./notes-controller.js";
export * from "./calendar-controller.js";
export * from "./task-controller.js";
export * from "./project-controller.js";
export * from "./push-subscription-controller.js";
export * from "./ws-api-controller.js";
