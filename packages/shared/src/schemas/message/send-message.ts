import { type } from "@arktype/type";

export const SendMessageInputSchema = type({
  userId: "number.integer > 0",
  contactId: "number.integer > 0",
  content: "string >= 1 & string <= 10000",
  "type?": "'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE'",
  "src?": "string",
  "+": "reject",
});

export type SendMessageInput = typeof SendMessageInputSchema.infer;
