import { type } from "@arktype/type";

export const UpdateProjectInputSchema = type({
  "title?": "string >= 1 & string <= 255",
  "description?": "string",
  "color?": "string",
  "startDate?": "string",
  "endDate?": "string",
  "dueDate?": "string",
  "isActive?": "boolean",
  "progress?": "number >= 0 & number <= 100",
  "+": "reject",
});

export type UpdateProjectInput = typeof UpdateProjectInputSchema.infer;
