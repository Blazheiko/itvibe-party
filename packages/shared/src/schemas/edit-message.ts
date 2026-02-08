import { type } from "@arktype/type";

export const EditMessageInputSchema = type({
  userId: "number.integer > 0",
  messageId: "number.integer > 0",
  content: "string >= 1 & string <= 10000",
  "+": "reject",
});

export type EditMessageInput = typeof EditMessageInputSchema.infer;
