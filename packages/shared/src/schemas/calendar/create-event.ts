import { type } from "@arktype/type";

export const CreateEventInputSchema = type({
  title: "string >= 1 & string <= 255",
  "description?": "string",
  startTime: "string",
  endTime: "string",
  "+": "reject",
});

export type CreateEventInput = typeof CreateEventInputSchema.infer;
