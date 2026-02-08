import { type } from "@arktype/type";

export const UpdateTaskInputSchema = type({
  "title?": "string >= 1 & string <= 255",
  "description?": "string",
  "projectId?": "number.integer > 0",
  "status?": "string",
  "priority?": "string",
  "progress?": "number >= 0 & number <= 100",
  "tags?": "string[]",
  "dueDate?": "string",
  "startDate?": "string",
  "estimatedHours?": "number >= 0",
  "actualHours?": "number >= 0",
  "+": "reject",
});

export type UpdateTaskInput = typeof UpdateTaskInputSchema.infer;
