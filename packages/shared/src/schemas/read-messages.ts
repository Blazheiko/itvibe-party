import { type } from "@arktype/type";

export const ReadMessagesInputSchema = type({
  userId: "number.integer > 0",
  contactId: "number.integer > 0",
  "+": "reject",
});

export type ReadMessagesInput = typeof ReadMessagesInputSchema.infer;
