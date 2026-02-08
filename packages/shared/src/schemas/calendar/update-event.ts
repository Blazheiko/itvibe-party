import { type } from "@arktype/type";

export const UpdateEventInputSchema = type({
  "title?": "string >= 1 & string <= 255",
  "description?": "string",
  "startTime?": "string",
  "endTime?": "string",
  "+": "reject",
});

export type UpdateEventInput = typeof UpdateEventInputSchema.infer;
