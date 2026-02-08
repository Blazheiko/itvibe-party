import { type } from "@arktype/type";

export const GetEventsByRangeInputSchema = type({
  startDate: "string",
  endDate: "string",
  "+": "reject",
});

export type GetEventsByRangeInput = typeof GetEventsByRangeInputSchema.infer;
