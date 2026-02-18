import { type } from "@arktype/type";

export const ProjectSchema = type({
  id: "number",
  title: "string",
  "description?": "string",
  "color?": "string",
  userId: "number",
  isActive: "boolean",
  isArchived: "boolean",
  progress: "number",
  "startDate?": "Date",
  "endDate?": "Date",
  "dueDate?": "Date",
  createdAt: "string",
  updatedAt: "string",
});
export type Project = typeof ProjectSchema.infer;

export const GetProjectsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "projects?": "unknown[]",
});
export type GetProjectsResponse = typeof GetProjectsResponseSchema.infer;

export const CreateProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "project?": "unknown",
});
export type CreateProjectResponse = typeof CreateProjectResponseSchema.infer;

export const GetProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type GetProjectResponse = typeof GetProjectResponseSchema.infer;

export const UpdateProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "project?": "unknown",
});
export type UpdateProjectResponse = typeof UpdateProjectResponseSchema.infer;

export const DeleteProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
});
export type DeleteProjectResponse = typeof DeleteProjectResponseSchema.infer;

export const GetProjectTasksResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetProjectTasksResponse =
  typeof GetProjectTasksResponseSchema.infer;

export const GetProjectStatisticsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type GetProjectStatisticsResponse =
  typeof GetProjectStatisticsResponseSchema.infer;

export const ArchiveProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown",
});
export type ArchiveProjectResponse = typeof ArchiveProjectResponseSchema.infer;
