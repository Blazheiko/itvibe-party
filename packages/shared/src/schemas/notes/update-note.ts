import { type } from "@arktype/type";

export const UpdateNoteInputSchema = type({
  title: "string >= 1 & string <= 255?",
  description: "string?",
  "+": "reject",
});

export type UpdateNoteInput = typeof UpdateNoteInputSchema.infer;
