import { type } from "@arktype/type";

export const WSEventTypingPayloadSchema = type({
  contactId: "string | number",
  "+": "delete",
});

export type WSEventTypingPayload = typeof WSEventTypingPayloadSchema.infer;
