import { type } from "@arktype/type";

export const GetMessagesInputSchema = type({
  userId: "number.integer > 0",
  contactId: "number.integer > 0",
  "+": "reject",
});

export type GetMessagesInput = typeof GetMessagesInputSchema.infer;
