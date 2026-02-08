import { type } from "@arktype/type";

export const MarkMessageAsReadInputSchema = type({
  messageId: "number.integer > 0",
  "+": "reject",
});

export type MarkMessageAsReadInput = typeof MarkMessageAsReadInputSchema.infer;
