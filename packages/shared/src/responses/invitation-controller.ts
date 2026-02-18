import { type } from "@arktype/type";

export const CreateInvitationResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "token?": "string",
});
export type CreateInvitationResponse = typeof CreateInvitationResponseSchema.infer;

export const GetUserInvitationsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "invitations?": "unknown[]",
});
export type GetUserInvitationsResponse =
  typeof GetUserInvitationsResponseSchema.infer;

export const UseInvitationResponseSchema = type({
  status: "'success' | 'error' | 'awaiting'",
  "message?": "string",
});
export type UseInvitationResponse = typeof UseInvitationResponseSchema.infer;
