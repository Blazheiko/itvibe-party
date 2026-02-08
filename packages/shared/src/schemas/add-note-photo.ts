import { type } from "@arktype/type";

export const AddPhotoInputSchema = type({
  src: "string >= 1",
  filename: "string >= 1",
  size: "number >= 0",
  "+": "reject",
});

export type AddPhotoInput = typeof AddPhotoInputSchema.infer;
