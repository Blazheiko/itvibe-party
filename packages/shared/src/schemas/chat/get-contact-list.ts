import { type } from "@arktype/type";

export const GetContactListInputSchema = type({
  userId: "number.integer > 0",
  "+": "reject",
});

export type GetContactListInput = typeof GetContactListInputSchema.infer;
