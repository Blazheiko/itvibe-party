import { type } from "@arktype/type";

export const WSTargetUserIdPayloadSchema = type({
  targetUserId: "string | number",
  "+": "delete",
});

export type WSTargetUserIdPayload = typeof WSTargetUserIdPayloadSchema.infer;
