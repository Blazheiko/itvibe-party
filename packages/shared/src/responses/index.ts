import { type } from "@arktype/type";

export const BaseResponseSchema = type({
  status: "string",
});
export type BaseResponse = typeof BaseResponseSchema.infer;

export const ErrorResponseSchema = type({
  status: "'error' | 'unauthorized'",
  message: "string",
});
export type ErrorResponse = typeof ErrorResponseSchema.infer;

export const SuccessResponseSchema = type({
  status: "'ok'",
  "data?": "unknown",
});
export type SuccessResponse = typeof SuccessResponseSchema.infer;

export type {
  PingResponse,
  TestRouteResponse,
  InitResponse,
  TestHeadersResponse,
  GetSetCookiesResponse,
  TestSessionResponse,
  SaveUserResponse,
  TestApiSessionResponse,
  IndexResponse,
  TestParamsResponse,
  SetHeaderAndCookieResponse,
  TestMiddlewareResponse,
  UpdateWsTokenResponse,
} from "./main-controller.js";

export type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  LogoutAllResponse,
} from "./auth-controller.js";

export type {
  User,
  Message,
  Contact,
  ContactList,
  GetContactListResponse,
  CreateChatResponse,
  DeleteChatResponse,
  GetMessagesResponse,
  SendMessageResponse,
  DeleteMessageResponse,
  EditMessageResponse,
  MarkAsReadResponse,
  MarkMessageAsReadResponse,
} from "./chat-list-controller.js";

export type {
  CreateInvitationResponse,
  GetUserInvitationsResponse,
  UseInvitationResponse,
} from "./invitation-controller.js";

export type {
  Note,
  NotePhoto,
  GetNotesResponse,
  CreateNoteResponse,
  GetNoteResponse,
  UpdateNoteResponse,
  DeleteNoteResponse,
  AddPhotoResponse,
  DeletePhotoResponse,
  AddNotePhotoResponse,
  DeleteNotePhotoResponse,
} from "./notes-controller.js";

export type {
  CalendarEvent,
  GetEventsResponse,
  CreateEventResponse,
  GetEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  GetEventsByDateResponse,
  GetEventsByRangeResponse,
} from "./calendar-controller.js";

export type {
  Task,
  TestTasksResponse,
  GetTasksResponse,
  CreateTaskResponse,
  GetTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  UpdateTaskStatusResponse,
  UpdateTaskProgressResponse,
  GetTasksByProjectResponse,
  GetSubTasksResponse,
} from "./task-controller.js";

export type {
  Project,
  GetProjectsResponse,
  CreateProjectResponse,
  GetProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  GetProjectTasksResponse,
  GetProjectStatisticsResponse,
  ArchiveProjectResponse,
} from "./project-controller.js";

export type {
  PushSubscription,
  PushSubscriptionLog,
  PushSubscriptionLogSummary,
  GetSubscriptionsResponse,
  CreateSubscriptionResponse,
  GetSubscriptionResponse,
  UpdateSubscriptionResponse,
  DeleteSubscriptionResponse,
  GetSubscriptionLogsResponse,
  GetSubscriptionStatisticsResponse,
  DeactivateSubscriptionResponse,
} from "./push-subscription-controller.js";

export type {
  EventTypingResponse,
  ReadMessageResponse,
  IncomingCallResponse,
  AcceptCallResponse,
  DeclineCallResponse,
  WebrtcCallOfferResponse,
  WebrtcCallAnswerResponse,
  WebrtcIceCandidateResponse,
  WebrtcStartCallResponse,
  WebrtcCancelCallResponse,
  WebrtcCallEndResponse,
  WSErrorResponse,
  TestWsResponse,
  WSSaveUserResponse,
} from "./ws-api-controller.js";

