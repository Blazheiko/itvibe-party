import { type } from "@arktype/type";

export const UpdateTaskStatusInputSchema = type({
  status: "string >= 1",
  "+": "reject",
});

export type UpdateTaskStatusInput = typeof UpdateTaskStatusInputSchema.infer;
