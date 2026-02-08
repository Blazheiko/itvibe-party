import { type } from "@arktype/type";

export const WSCallerIdPayloadSchema = type({
  callerId: "string | number",
  "+": "delete",
});

export type WSCallerIdPayload = typeof WSCallerIdPayloadSchema.infer;
