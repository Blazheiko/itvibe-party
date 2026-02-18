import { type } from "@arktype/type";

export const CalendarEventSchema = type({
  id: "bigint",
  title: "string",
  "description?": "string | null",
  startTime: "string | null",
  endTime: "string | null",
  userId: "bigint",
  created_at: "string | null",
  updated_at: "string | null",
});
export type CalendarEvent = typeof CalendarEventSchema.infer;

export const GetEventsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetEventsResponse = typeof GetEventsResponseSchema.infer;

export const CreateEventResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type CreateEventResponse = typeof CreateEventResponseSchema.infer;

export const GetEventResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown | null",
});
export type GetEventResponse = typeof GetEventResponseSchema.infer;

export const UpdateEventResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown | null",
});
export type UpdateEventResponse = typeof UpdateEventResponseSchema.infer;

export const DeleteEventResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
});
export type DeleteEventResponse = typeof DeleteEventResponseSchema.infer;

export const GetEventsByDateResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetEventsByDateResponse =
  typeof GetEventsByDateResponseSchema.infer;

export const GetEventsByRangeResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetEventsByRangeResponse =
  typeof GetEventsByRangeResponseSchema.infer;
