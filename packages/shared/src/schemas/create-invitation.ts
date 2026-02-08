import { type } from "@arktype/type";

export const CreateInvitationInputSchema = type({
  userId: "number.integer > 0",
  name: "string >= 1 & string <= 100",
  "+": "reject",
});

export type CreateInvitationInput = typeof CreateInvitationInputSchema.infer;
