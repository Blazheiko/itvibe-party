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
} from './main-controller.js';

export type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  LogoutAllResponse,
} from './auth-controller.js';

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
} from './chat-list-controller.js';

export type {
  CreateInvitationResponse,
  GetUserInvitationsResponse,
  UseInvitationResponse,
} from './invitation-controller.js';

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
} from './notes-controller.js';

export type {
  CalendarEvent,
  GetEventsResponse,
  CreateEventResponse,
  GetEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  GetEventsByDateResponse,
  GetEventsByRangeResponse,
} from './calendar-controller.js';

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
} from './task-controller.js';

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
} from './project-controller.js';

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
} from './push-subscription-controller.js';

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
} from './ws-api-controller.js';

export type ControllerResponseSchemaMap = {
  'MainController.TestRouteResponse': import('./main-controller.js').TestRouteResponse;
  'MainController.InitResponse': import('./main-controller.js').InitResponse;
  'MainController.TestHeadersResponse': import('./main-controller.js').TestHeadersResponse;
  'MainController.GetSetCookiesResponse': import('./main-controller.js').GetSetCookiesResponse;
  'MainController.TestSessionResponse': import('./main-controller.js').TestSessionResponse;
  'MainController.SaveUserResponse': import('./main-controller.js').SaveUserResponse;
  'MainController.SetHeaderAndCookieResponse': import('./main-controller.js').SetHeaderAndCookieResponse;
  'MainController.TestMiddlewareResponse': import('./main-controller.js').TestMiddlewareResponse;
  'MainController.UpdateWsTokenResponse': import('./main-controller.js').UpdateWsTokenResponse;

  'AuthController.RegisterResponse': import('./auth-controller.js').RegisterResponse;
  'AuthController.LoginResponse': import('./auth-controller.js').LoginResponse;
  'AuthController.LogoutResponse': import('./auth-controller.js').LogoutResponse;
  'AuthController.LogoutAllResponse': import('./auth-controller.js').LogoutAllResponse;

  'ChatListController.GetContactListResponse': import('./chat-list-controller.js').GetContactListResponse;
  'ChatListController.CreateChatResponse': import('./chat-list-controller.js').CreateChatResponse;
  'ChatListController.DeleteChatResponse': import('./chat-list-controller.js').DeleteChatResponse;
  'ChatListController.GetMessagesResponse': import('./chat-list-controller.js').GetMessagesResponse;
  'ChatListController.SendMessageResponse': import('./chat-list-controller.js').SendMessageResponse;
  'ChatListController.DeleteMessageResponse': import('./chat-list-controller.js').DeleteMessageResponse;
  'ChatListController.EditMessageResponse': import('./chat-list-controller.js').EditMessageResponse;
  'ChatListController.MarkMessageAsReadResponse': import('./chat-list-controller.js').MarkMessageAsReadResponse;

  'InvitationController.CreateInvitationResponse': import('./invitation-controller.js').CreateInvitationResponse;
  'InvitationController.GetUserInvitationsResponse': import('./invitation-controller.js').GetUserInvitationsResponse;
  'InvitationController.UseInvitationResponse': import('./invitation-controller.js').UseInvitationResponse;

  'NotesController.GetNotesResponse': import('./notes-controller.js').GetNotesResponse;
  'NotesController.CreateNoteResponse': import('./notes-controller.js').CreateNoteResponse;
  'NotesController.GetNoteResponse': import('./notes-controller.js').GetNoteResponse;
  'NotesController.UpdateNoteResponse': import('./notes-controller.js').UpdateNoteResponse;
  'NotesController.DeleteNoteResponse': import('./notes-controller.js').DeleteNoteResponse;
  'NotesController.AddNotePhotoResponse': import('./notes-controller.js').AddNotePhotoResponse;
  'NotesController.DeleteNotePhotoResponse': import('./notes-controller.js').DeleteNotePhotoResponse;

  'CalendarController.GetEventsResponse': import('./calendar-controller.js').GetEventsResponse;
  'CalendarController.CreateEventResponse': import('./calendar-controller.js').CreateEventResponse;
  'CalendarController.GetEventResponse': import('./calendar-controller.js').GetEventResponse;
  'CalendarController.UpdateEventResponse': import('./calendar-controller.js').UpdateEventResponse;
  'CalendarController.DeleteEventResponse': import('./calendar-controller.js').DeleteEventResponse;
  'CalendarController.GetEventsByDateResponse': import('./calendar-controller.js').GetEventsByDateResponse;
  'CalendarController.GetEventsByRangeResponse': import('./calendar-controller.js').GetEventsByRangeResponse;

  'TaskController.TestTasksResponse': import('./task-controller.js').TestTasksResponse;
  'TaskController.GetTasksResponse': import('./task-controller.js').GetTasksResponse;
  'TaskController.CreateTaskResponse': import('./task-controller.js').CreateTaskResponse;
  'TaskController.GetTaskResponse': import('./task-controller.js').GetTaskResponse;
  'TaskController.UpdateTaskResponse': import('./task-controller.js').UpdateTaskResponse;
  'TaskController.DeleteTaskResponse': import('./task-controller.js').DeleteTaskResponse;
  'TaskController.UpdateTaskStatusResponse': import('./task-controller.js').UpdateTaskStatusResponse;
  'TaskController.UpdateTaskProgressResponse': import('./task-controller.js').UpdateTaskProgressResponse;
  'TaskController.GetTasksByProjectResponse': import('./task-controller.js').GetTasksByProjectResponse;
  'TaskController.GetSubTasksResponse': import('./task-controller.js').GetSubTasksResponse;

  'ProjectController.GetProjectsResponse': import('./project-controller.js').GetProjectsResponse;
  'ProjectController.CreateProjectResponse': import('./project-controller.js').CreateProjectResponse;
  'ProjectController.GetProjectResponse': import('./project-controller.js').GetProjectResponse;
  'ProjectController.UpdateProjectResponse': import('./project-controller.js').UpdateProjectResponse;
  'ProjectController.DeleteProjectResponse': import('./project-controller.js').DeleteProjectResponse;
  'ProjectController.GetProjectTasksResponse': import('./project-controller.js').GetProjectTasksResponse;
  'ProjectController.GetProjectStatisticsResponse': import('./project-controller.js').GetProjectStatisticsResponse;
  'ProjectController.ArchiveProjectResponse': import('./project-controller.js').ArchiveProjectResponse;

  'PushSubscriptionController.GetSubscriptionsResponse': import('./push-subscription-controller.js').GetSubscriptionsResponse;
  'PushSubscriptionController.CreateSubscriptionResponse': import('./push-subscription-controller.js').CreateSubscriptionResponse;
  'PushSubscriptionController.GetSubscriptionResponse': import('./push-subscription-controller.js').GetSubscriptionResponse;
  'PushSubscriptionController.UpdateSubscriptionResponse': import('./push-subscription-controller.js').UpdateSubscriptionResponse;
  'PushSubscriptionController.DeleteSubscriptionResponse': import('./push-subscription-controller.js').DeleteSubscriptionResponse;
  'PushSubscriptionController.GetSubscriptionLogsResponse': import('./push-subscription-controller.js').GetSubscriptionLogsResponse;
  'PushSubscriptionController.GetSubscriptionStatisticsResponse': import('./push-subscription-controller.js').GetSubscriptionStatisticsResponse;
  'PushSubscriptionController.DeactivateSubscriptionResponse': import('./push-subscription-controller.js').DeactivateSubscriptionResponse;

  'WSApiController.EventTypingResponse': import('./ws-api-controller.js').EventTypingResponse;
  'WSApiController.ReadMessageResponse': import('./ws-api-controller.js').ReadMessageResponse;
  'WSApiController.IncomingCallResponse': import('./ws-api-controller.js').IncomingCallResponse;
  'WSApiController.AcceptCallResponse': import('./ws-api-controller.js').AcceptCallResponse;
  'WSApiController.DeclineCallResponse': import('./ws-api-controller.js').DeclineCallResponse;
  'WSApiController.WebrtcCallOfferResponse': import('./ws-api-controller.js').WebrtcCallOfferResponse;
  'WSApiController.WebrtcCallAnswerResponse': import('./ws-api-controller.js').WebrtcCallAnswerResponse;
  'WSApiController.WebrtcIceCandidateResponse': import('./ws-api-controller.js').WebrtcIceCandidateResponse;
  'WSApiController.WebrtcStartCallResponse': import('./ws-api-controller.js').WebrtcStartCallResponse;
  'WSApiController.WebrtcCancelCallResponse': import('./ws-api-controller.js').WebrtcCancelCallResponse;
  'WSApiController.WebrtcCallEndResponse': import('./ws-api-controller.js').WebrtcCallEndResponse;
  'WSApiController.ErrorResponse': import('./ws-api-controller.js').WSErrorResponse;
  'WSApiController.TestWsResponse': import('./ws-api-controller.js').TestWsResponse;
  'WSApiController.SaveUserResponse': import('./ws-api-controller.js').WSSaveUserResponse;
};

export type ControllerResponseSchemaKey = keyof ControllerResponseSchemaMap;
