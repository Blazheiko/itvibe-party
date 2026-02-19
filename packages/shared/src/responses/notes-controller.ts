import { type } from "@arktype/type";

export const NoteSchema = type({
  id: "number",
  title: "string",
  description: "string",
  userId: "number",
  createdAt: "string",
  updatedAt: "string",
});
export type Note = typeof NoteSchema.infer;

export const NotePhotoSchema = type({
  id: "number",
  noteId: "number",
  src: "string",
  filename: "string",
  size: "number",
  createdAt: "string",
});
export type NotePhoto = typeof NotePhotoSchema.infer;

export const GetNotesResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetNotesResponse = typeof GetNotesResponseSchema.infer;

export const CreateNoteResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type CreateNoteResponse = typeof CreateNoteResponseSchema.infer;

export const GetNoteResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type GetNoteResponse = typeof GetNoteResponseSchema.infer;

export const UpdateNoteResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type UpdateNoteResponse = typeof UpdateNoteResponseSchema.infer;

export const DeleteNoteResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
});
export type DeleteNoteResponse = typeof DeleteNoteResponseSchema.infer;

export const AddPhotoResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
  "photo?": "unknown",
});
export type AddPhotoResponse = typeof AddPhotoResponseSchema.infer;

export const DeletePhotoResponseSchema = type({
  status: "'ok' | 'error'",
  "message?": "string",
});
export type DeletePhotoResponse = typeof DeletePhotoResponseSchema.infer;

export const AddNotePhotoResponseSchema = AddPhotoResponseSchema;
export const DeleteNotePhotoResponseSchema = DeletePhotoResponseSchema;
export type AddNotePhotoResponse = AddPhotoResponse;
export type DeleteNotePhotoResponse = DeletePhotoResponse;
