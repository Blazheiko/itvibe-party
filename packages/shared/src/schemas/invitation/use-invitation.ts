import { type } from "@arktype/type";

export const UseInvitationInputSchema = type({
  token: "string >= 1 & string <= 50",
  "+": "reject",
});

export type UseInvitationInput = typeof UseInvitationInputSchema.infer;
