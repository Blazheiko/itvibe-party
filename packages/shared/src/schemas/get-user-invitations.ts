import { type } from "@arktype/type";

export const GetUserInvitationsInputSchema = type({
  userId: "number.integer > 0",
  "+": "reject",
});

export type GetUserInvitationsInput = typeof GetUserInvitationsInputSchema.infer;
