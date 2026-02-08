import { type } from "@arktype/type";

export const CreateNoteInputSchema = type({
  title: "string >= 1 & string <= 255",
  description: "string",
  "+": "reject",
});

export type CreateNoteInput = typeof CreateNoteInputSchema.infer;
