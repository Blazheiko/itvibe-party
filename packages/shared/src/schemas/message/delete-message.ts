import { type } from "@arktype/type";

export const DeleteMessageInputSchema = type({
  userId: "number.integer > 0",
  messageId: "number.integer > 0",
  "+": "reject",
});

export type DeleteMessageInput = typeof DeleteMessageInputSchema.infer;
