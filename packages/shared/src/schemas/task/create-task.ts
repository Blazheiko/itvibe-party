import { type } from "@arktype/type";

export const CreateTaskInputSchema = type({
  title: "string >= 1 & string <= 255",
  "description?": "string",
  "projectId?": "number.integer > 0",
  "status?": "string",
  "priority?": "string",
  "tags?": "string[]",
  "dueDate?": "string",
  "startDate?": "string",
  "estimatedHours?": "number >= 0",
  "parentTaskId?": "number.integer > 0",
  "+": "reject",
});

export type CreateTaskInput = typeof CreateTaskInputSchema.infer;
