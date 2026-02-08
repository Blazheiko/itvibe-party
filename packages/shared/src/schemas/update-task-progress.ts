import { type } from "@arktype/type";

export const UpdateTaskProgressInputSchema = type({
  progress: "string",
  "+": "reject",
});

export type UpdateTaskProgressInput = typeof UpdateTaskProgressInputSchema.infer;
