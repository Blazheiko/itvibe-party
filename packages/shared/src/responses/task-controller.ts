import { type } from "@arktype/type";

export const TaskSchema = type({
  id: "number",
  title: "string",
  "description?": "string",
  status: "string",
  "priority?": "string",
  progress: "number",
  "projectId?": "number",
  "parentTaskId?": "number",
  userId: "number",
  "tags?": "string[]",
  "dueDate?": "Date",
  "startDate?": "Date",
  "estimatedHours?": "number",
  "actualHours?": "number",
  createdAt: "string",
  updatedAt: "string",
});
export type Task = typeof TaskSchema.infer;

export const TestTasksResponseSchema = type({
  status: "'ok' | 'error'",
  "tasks?": "unknown[]",
});
export type TestTasksResponse = typeof TestTasksResponseSchema.infer;

export const GetTasksResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "tasks?": "unknown[]",
  "projects?": "unknown[]",
});
export type GetTasksResponse = typeof GetTasksResponseSchema.infer;

export const CreateTaskResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "task?": "unknown",
});
export type CreateTaskResponse = typeof CreateTaskResponseSchema.infer;

export const GetTaskResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "task?": "unknown",
});
export type GetTaskResponse = typeof GetTaskResponseSchema.infer;

export const UpdateTaskResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "task?": "unknown",
});
export type UpdateTaskResponse = typeof UpdateTaskResponseSchema.infer;

export const DeleteTaskResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
});
export type DeleteTaskResponse = typeof DeleteTaskResponseSchema.infer;

export const UpdateTaskStatusResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "task?": "unknown",
});
export type UpdateTaskStatusResponse =
  typeof UpdateTaskStatusResponseSchema.infer;

export const UpdateTaskProgressResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "task?": "unknown",
});
export type UpdateTaskProgressResponse =
  typeof UpdateTaskProgressResponseSchema.infer;

export const GetTasksByProjectResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "tasks?": "unknown[]",
});
export type GetTasksByProjectResponse =
  typeof GetTasksByProjectResponseSchema.infer;

export const GetSubTasksResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "tasks?": "unknown[]",
});
export type GetSubTasksResponse = typeof GetSubTasksResponseSchema.infer;
