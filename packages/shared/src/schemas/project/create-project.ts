import { type } from "@arktype/type";

export const CreateProjectInputSchema = type({
  title: "string >= 1 & string <= 255",
  "description?": "string",
  "color?": "string",
  "startDate?": "string",
  "endDate?": "string",
  "dueDate?": "string",
  "+": "reject",
});

export type CreateProjectInput = typeof CreateProjectInputSchema.infer;
