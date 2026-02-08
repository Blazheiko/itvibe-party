import { type } from "@arktype/type";

export const CreateChatInputSchema = type({
  participantId: "number.integer > 0",
  "+": "reject",
});

export type CreateChatInput = typeof CreateChatInputSchema.infer;
