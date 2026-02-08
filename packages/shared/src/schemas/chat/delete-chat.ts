import { type } from "@arktype/type";

export const DeleteChatInputSchema = type({
  chatId: "number.integer > 0",
  "+": "reject",
});

export type DeleteChatInput = typeof DeleteChatInputSchema.infer;
