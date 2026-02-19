import MainController from "#app/controllers/http/main-controller.js";
import AuthController from "#app/controllers/http/auth-controller.js";
import ChatListController from "#app/controllers/http/chat-list-controller.js";
import MessageController from "#app/controllers/http/message-controller.js";
import InvitationController from "#app/controllers/http/invitation-controller.js";
import NotesController from "#app/controllers/http/notes-controller.js";
import CalendarController from "#app/controllers/http/calendar-controller.js";
import TaskController from "#app/controllers/http/task-controller.js";
import ProjectController from "#app/controllers/http/project-controller.js";
import PushSubscriptionController from "#app/controllers/http/push-subscription-controller.js";
import { defineRoute } from "#vendor/utils/routing/define-route.js";
import * as ResponseSchemas from "shared/responses";

import {
  RegisterInputSchema,
  LoginInputSchema,
  CreateChatInputSchema,
  DeleteChatInputSchema,
  GetMessagesInputSchema,
  SendMessageInputSchema,
  DeleteMessageInputSchema,
  EditMessageInputSchema,
  MarkMessageAsReadInputSchema,
  CreateInvitationInputSchema,
  GetUserInvitationsInputSchema,
  UseInvitationInputSchema,
  SaveUserInputSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  CreateEventInputSchema,
  UpdateEventInputSchema,
  GetEventsByRangeInputSchema,
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  UpdateTaskStatusInputSchema,
  UpdateTaskProgressInputSchema,
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  CreateSubscriptionInputSchema,
  UpdateSubscriptionInputSchema,
  GetContactListInputSchema,
} from "shared/schemas";

export default [
  {
    group: [
      defineRoute({
        url: "/test-route-4",
        method: "get",
        handler: MainController.testRoute.bind(MainController),
        ResponseSchema: ResponseSchemas.TestRouteResponseSchema,
        description: "Test route",
      }),
    ],
    description: "Test routes",
    prefix: "test",
  },
  {
    group: [
      defineRoute({
        url: "/register",
        method: "post",
        handler: AuthController.register.bind(AuthController),
        validator: RegisterInputSchema,
        ResponseSchema: ResponseSchemas.RegisterResponseSchema,
        description: "Register a new user",
      }),
      defineRoute({
        url: "/login",
        method: "post",
        handler: AuthController.login.bind(AuthController),
        validator: LoginInputSchema,
        ResponseSchema: ResponseSchemas.LoginResponseSchema,
        description: "Login a user",
      }),
      defineRoute({
        url: "/logout",
        method: "post",
        handler: AuthController.logout.bind(AuthController),
        ResponseSchema: ResponseSchemas.LogoutResponseSchema,
        description: "Logout a user",
        middlewares: ["auth_guard"],
      }),
      defineRoute({
        url: "/logout-all",
        method: "post",
        handler: AuthController.logoutAll.bind(AuthController),
        ResponseSchema: ResponseSchemas.LogoutAllResponseSchema,
        description: "Logout all devices",
        middlewares: ["auth_guard"],
      }),
    ],
    description: "Auth routes",
    middlewares: ["session_web"],
    prefix: "auth",
    rateLimit: {
      windowMs: 1 * 60 * 1000,
      maxRequests: 10,
    },
  },
  {
    group: [
      defineRoute({
        url: "/get-contact-list",
        method: "post",
        handler: ChatListController.getContactList.bind(ChatListController),
        validator: GetContactListInputSchema,
        ResponseSchema: ResponseSchemas.GetContactListResponseSchema,
        description: "Get contact list",
      }),
      defineRoute({
        url: "/chats",
        method: "post",
        handler: ChatListController.createChat.bind(ChatListController),
        validator: CreateChatInputSchema,
        ResponseSchema: ResponseSchemas.CreateChatResponseSchema,
        description: "Create a new chat",
      }),
      defineRoute({
        url: "/chats/:chatId",
        method: "delete",
        handler: ChatListController.deleteChat.bind(ChatListController),
        validator: DeleteChatInputSchema,
        ResponseSchema: ResponseSchemas.DeleteChatResponseSchema,
        description: "Delete a chat",
      }),
      defineRoute({
        url: "/get-messages",
        method: "post",
        handler: MessageController.getMessages.bind(MessageController),
        validator: GetMessagesInputSchema,
        ResponseSchema: ResponseSchemas.GetMessagesResponseSchema,
        description: "Get messages",
      }),
      defineRoute({
        url: "/send-chat-messages",
        method: "post",
        handler: MessageController.sendChatMessage.bind(MessageController),
        validator: SendMessageInputSchema,
        ResponseSchema: ResponseSchemas.SendMessageResponseSchema,
        description: "Send a message",
      }),
      defineRoute({
        url: "/messages/:messageId",
        method: "delete",
        handler: MessageController.deleteMessage.bind(MessageController),
        validator: DeleteMessageInputSchema,
        ResponseSchema: ResponseSchemas.DeleteMessageResponseSchema,
        description: "Delete a message",
      }),
      defineRoute({
        url: "/messages/:messageId",
        method: "put",
        handler: MessageController.editMessage.bind(MessageController),
        validator: EditMessageInputSchema,
        ResponseSchema: ResponseSchemas.EditMessageResponseSchema,
        description: "Edit a message",
      }),
      defineRoute({
        url: "/messages/:messageId/read",
        method: "put",
        handler: MessageController.markAsRead.bind(MessageController),
        validator: MarkMessageAsReadInputSchema,
        ResponseSchema: ResponseSchemas.MarkMessageAsReadResponseSchema,
        description: "Mark a message as read",
      }),
      // Invitation Routes
      defineRoute({
        url: "/invitations",
        method: "post",
        handler:
          InvitationController.createInvitation.bind(InvitationController),
        validator: CreateInvitationInputSchema,
        ResponseSchema: ResponseSchemas.CreateInvitationResponseSchema,
        description: "Create an invitation",
      }),
      defineRoute({
        url: "/invitations/user/:userId",
        method: "get",
        handler:
          InvitationController.getUserInvitations.bind(InvitationController),
        validator: GetUserInvitationsInputSchema,
        ResponseSchema: ResponseSchemas.GetUserInvitationsResponseSchema,
        description: "Get user invitations",
      }),
    ],
    description: "Chat routes",
    middlewares: ["session_web", "auth_guard"],
    prefix: "chat",
  },
  {
    group: [
      defineRoute({
        url: "/init",
        method: "get",
        handler: MainController.init.bind(MainController),
        ResponseSchema: ResponseSchemas.InitResponseSchema,
        description: "Initialize the main controller",
        middlewares: ["auth_guard"],
      }),
      defineRoute({
        url: "/update-ws-token",
        method: "get",
        handler: MainController.updateWsToken.bind(MainController),
        ResponseSchema: ResponseSchemas.UpdateWsTokenResponseSchema,
        description: "Update the WebSocket token",
        middlewares: ["auth_guard"],
      }),
      defineRoute({
        url: "/invitations/use",
        method: "post",
        handler: InvitationController.useInvitation.bind(InvitationController),
        validator: UseInvitationInputSchema,
        ResponseSchema: ResponseSchemas.UseInvitationResponseSchema,
        description: "Use an invitation",
      }),
      defineRoute({
        url: "/test-header/:testParam/param2/:testParam2",
        method: "get",
        handler: MainController.testHeaders.bind(MainController),
        ResponseSchema: ResponseSchemas.TestHeadersResponseSchema,
        description: "Test headers",
      }),
      defineRoute({
        url: "/test-cookie",
        method: "get",
        handler: MainController.getSetCookies.bind(MainController),
        ResponseSchema: ResponseSchemas.GetSetCookiesResponseSchema,
        description: "Test cookies",
      }),
      defineRoute({
        url: "/test-session",
        method: "get",
        handler: MainController.testSession.bind(MainController),
        ResponseSchema: ResponseSchemas.TestSessionResponseSchema,
        description: "Test session",
      }),
      defineRoute({
        url: "/save-user",
        method: "post",
        handler: MainController.saveUser.bind(MainController),
        validator: SaveUserInputSchema,
        ResponseSchema: ResponseSchemas.SaveUserResponseSchema,
        description: "Save a user",
      }),
      defineRoute({
        url: "/set-header-and-cookie",
        method: "get",
        handler: MainController.setHeaderAndCookie.bind(MainController),
        ResponseSchema: ResponseSchemas.SetHeaderAndCookieResponseSchema,
        description: "Set header and cookie",
      }),
      defineRoute({
        url: "/test-middleware",
        method: "get",
        handler: MainController.testMiddleware.bind(MainController),
        middlewares: ["test1"],
        ResponseSchema: ResponseSchemas.TestMiddlewareResponseSchema,
        description: "Test middleware",
      }),
      {
        group: [
          defineRoute({
            url: "/test-middleware-2",
            method: "get",
            handler: MainController.testMiddleware2.bind(MainController),
            middlewares: ["test2"],
            ResponseSchema: ResponseSchemas.TestMiddlewareResponseSchema,
          }),
          {
            group: [
              defineRoute({
                url: "/test-middleware-3",
                method: "get",
                handler: MainController.testMiddleware3.bind(MainController),
                middlewares: ["test4"],
                ResponseSchema: ResponseSchemas.TestMiddlewareResponseSchema,
              }),
            ],
            middlewares: ["test3"],
            prefix: "test3",
          },
        ],
        middlewares: ["test2"],
        prefix: "test2",
      },
    ],
    description: "Main routes",
    middlewares: ["session_web"],
    prefix: "main",
  },
  {
    group: [
      // Notes Routes
      defineRoute({
        url: "/",
        method: "get",
        handler: NotesController.getNotes.bind(NotesController),
        ResponseSchema: ResponseSchemas.GetNotesResponseSchema,
        description: "Get all notes",
      }),
      defineRoute({
        url: "/",
        method: "post",
        handler: NotesController.createNote.bind(NotesController),
        validator: CreateNoteInputSchema,
        ResponseSchema: ResponseSchemas.CreateNoteResponseSchema,
        description: "Create a new note",
      }),
      defineRoute({
        url: "/:noteId",
        method: "get",
        handler: NotesController.getNote.bind(NotesController),
        ResponseSchema: ResponseSchemas.GetNoteResponseSchema,
        description: "Get a note by id",
      }),
      defineRoute({
        url: "/:noteId",
        method: "put",
        handler: NotesController.updateNote.bind(NotesController),
        validator: UpdateNoteInputSchema,
        ResponseSchema: ResponseSchemas.UpdateNoteResponseSchema,
        description: "Update a note by id",
      }),
      defineRoute({
        url: "/:noteId",
        method: "delete",
        handler: NotesController.deleteNote.bind(NotesController),
        ResponseSchema: ResponseSchemas.DeleteNoteResponseSchema,
        description: "Delete a note by id",
      }),
      // Notes Photo Routes
      defineRoute({
        url: "/:noteId/photos",
        method: "post",
        handler: NotesController.addPhoto.bind(NotesController),
        ResponseSchema: ResponseSchemas.AddNotePhotoResponseSchema,
        description: "Add a photo to a note",
      }),
      defineRoute({
        url: "/:noteId/photos/:photoId",
        method: "delete",
        handler: NotesController.deletePhoto.bind(NotesController),
        ResponseSchema: ResponseSchemas.DeleteNotePhotoResponseSchema,
        description: "Delete a photo from a note",
      }),
    ],
    description: "Notes routes",
    middlewares: ["session_web", "auth_guard"],
    prefix: "notes",
  },
  {
    group: [
      // Calendar Routes
      defineRoute({
        url: "/events",
        method: "get",
        handler: CalendarController.getEvents.bind(CalendarController),
        ResponseSchema: ResponseSchemas.GetEventsResponseSchema,
        description: "Get all events",
      }),
      defineRoute({
        url: "/events",
        method: "post",
        handler: CalendarController.createEvent.bind(CalendarController),
        validator: CreateEventInputSchema,
        ResponseSchema: ResponseSchemas.CreateEventResponseSchema,
        description: "Create a new event",
      }),
      defineRoute({
        url: "/events/:eventId",
        method: "get",
        handler: CalendarController.getEvent.bind(CalendarController),
        ResponseSchema: ResponseSchemas.GetEventResponseSchema,
        description: "Get an event by id",
      }),
      defineRoute({
        url: "/events/:eventId",
        method: "put",
        handler: CalendarController.updateEvent.bind(CalendarController),
        validator: UpdateEventInputSchema,
        ResponseSchema: ResponseSchemas.UpdateEventResponseSchema,
        description: "Update an event by id",
      }),
      defineRoute({
        url: "/events/:eventId",
        method: "delete",
        handler: CalendarController.deleteEvent.bind(CalendarController),
        ResponseSchema: ResponseSchemas.DeleteEventResponseSchema,
        description: "Delete an event by id",
      }),
      // Calendar specific routes
      defineRoute({
        url: "/events/date/:date",
        method: "get",
        handler: CalendarController.getEventsByDate.bind(CalendarController),
        ResponseSchema: ResponseSchemas.GetEventsByDateResponseSchema,
        description: "Get all events for a date",
      }),
      defineRoute({
        url: "/events/range",
        method: "post",
        handler: CalendarController.getEventsByRange.bind(CalendarController),
        validator: GetEventsByRangeInputSchema,
        ResponseSchema: ResponseSchemas.GetEventsByRangeResponseSchema,
        description: "Get all events for a range of dates",
      }),
    ],
    description: "Calendar routes",
    middlewares: ["session_web"],
    prefix: "calendar",
  },
  {
    group: [
      // Task Routes
      defineRoute({
        url: "/",
        method: "get",
        handler: TaskController.getTasks.bind(TaskController),
        ResponseSchema: ResponseSchemas.GetTasksResponseSchema,
        description: "Get all tasks",
      }),
      defineRoute({
        url: "/",
        method: "post",
        handler: TaskController.createTask.bind(TaskController),
        validator: CreateTaskInputSchema,
        ResponseSchema: ResponseSchemas.CreateTaskResponseSchema,
        description: "Create a new task",
      }),
      defineRoute({
        url: "/:taskId",
        method: "get",
        handler: TaskController.getTask.bind(TaskController),
        ResponseSchema: ResponseSchemas.GetTaskResponseSchema,
        description: "Get a task by id",
      }),
      defineRoute({
        url: "/:taskId",
        method: "put",
        handler: TaskController.updateTask.bind(TaskController),
        validator: UpdateTaskInputSchema,
        ResponseSchema: ResponseSchemas.UpdateTaskResponseSchema,
        description: "Update a task by id",
      }),
      defineRoute({
        url: "/:taskId",
        method: "delete",
        handler: TaskController.deleteTask.bind(TaskController),
        ResponseSchema: ResponseSchemas.DeleteTaskResponseSchema,
        description: "Delete a task by id",
      }),
      // Task specific routes
      defineRoute({
        url: "/:taskId/status",
        method: "put",
        handler: TaskController.updateTaskStatus.bind(TaskController),
        ResponseSchema: ResponseSchemas.UpdateTaskStatusResponseSchema,
        validator: UpdateTaskStatusInputSchema,
        description: "Update a task status by id",
      }),
      defineRoute({
        url: "/:taskId/progress",
        method: "put",
        handler: TaskController.updateTaskProgress.bind(TaskController),
        ResponseSchema: ResponseSchemas.UpdateTaskProgressResponseSchema,
        validator: UpdateTaskProgressInputSchema,
        description: "Update a task progress by id",
      }),
      defineRoute({
        url: "/project/:projectId",
        method: "get",
        handler: TaskController.getTasksByProject.bind(TaskController),
        ResponseSchema: ResponseSchemas.GetTasksByProjectResponseSchema,
        description: "Get all tasks for a project",
      }),
      defineRoute({
        url: "/:parentTaskId/subtasks",
        method: "get",
        handler: TaskController.getSubTasks.bind(TaskController),
        ResponseSchema: ResponseSchemas.GetSubTasksResponseSchema,
        description: "Get all subtasks for a task",
      }),
    ],
    description: "Task routes",
    middlewares: ["session_web"],
    prefix: "tasks",
  },
  {
    group: [
      // Project Routes
      defineRoute({
        url: "/",
        method: "get",
        handler: ProjectController.getProjects.bind(ProjectController),
        ResponseSchema: ResponseSchemas.GetProjectsResponseSchema,
        description: "Get all projects",
      }),
      defineRoute({
        url: "/create",
        method: "post",
        handler: ProjectController.createProject.bind(ProjectController),
        validator: CreateProjectInputSchema,
        ResponseSchema: ResponseSchemas.CreateProjectResponseSchema,
        description: "Create a new project",
      }),
      defineRoute({
        url: "/:projectId",
        method: "get",
        handler: ProjectController.getProject.bind(ProjectController),
        ResponseSchema: ResponseSchemas.GetProjectResponseSchema,
        description: "Get a project by id",
      }),
      defineRoute({
        url: "/:projectId",
        method: "put",
        handler: ProjectController.updateProject.bind(ProjectController),
        validator: UpdateProjectInputSchema,
        ResponseSchema: ResponseSchemas.UpdateProjectResponseSchema,
        description: "Update a project by id",
      }),
      defineRoute({
        url: "/:projectId",
        method: "delete",
        handler: ProjectController.deleteProject.bind(ProjectController),
        ResponseSchema: ResponseSchemas.DeleteProjectResponseSchema,
        description: "Delete a project by id",
      }),
      // Project specific routes
      defineRoute({
        url: "/:projectId/tasks",
        method: "get",
        handler: ProjectController.getProjectTasks.bind(ProjectController),
        ResponseSchema: ResponseSchemas.GetProjectTasksResponseSchema,
        description: "Get all tasks for a project",
      }),
      defineRoute({
        url: "/:projectId/statistics",
        method: "get",
        handler: ProjectController.getProjectStatistics.bind(ProjectController),
        ResponseSchema: ResponseSchemas.GetProjectStatisticsResponseSchema,
        description: "Get statistics for a project",
      }),
      defineRoute({
        url: "/:projectId/archive",
        method: "put",
        handler: ProjectController.archiveProject.bind(ProjectController),
        ResponseSchema: ResponseSchemas.ArchiveProjectResponseSchema,
        description: "Archive a project by id",
      }),
    ],
    description: "Project routes",
    middlewares: ["session_web"],
    prefix: "projects",
  },
  {
    group: [
      // Push Subscription Routes
      defineRoute({
        url: "/",
        method: "get",
        handler: PushSubscriptionController.getSubscriptions.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.GetSubscriptionsResponseSchema,
      }),
      defineRoute({
        url: "/",
        method: "post",
        handler: PushSubscriptionController.createSubscription.bind(
          PushSubscriptionController,
        ),
        validator: CreateSubscriptionInputSchema,
        ResponseSchema: ResponseSchemas.CreateSubscriptionResponseSchema,
      }),
      defineRoute({
        url: "/:subscriptionId",
        method: "get",
        handler: PushSubscriptionController.getSubscription.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.GetSubscriptionResponseSchema,
      }),
      defineRoute({
        url: "/:subscriptionId",
        method: "put",
        handler: PushSubscriptionController.updateSubscription.bind(
          PushSubscriptionController,
        ),
        validator: UpdateSubscriptionInputSchema,
        ResponseSchema: ResponseSchemas.UpdateSubscriptionResponseSchema,
      }),
      defineRoute({
        url: "/:subscriptionId",
        method: "delete",
        handler: PushSubscriptionController.deleteSubscription.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.DeleteSubscriptionResponseSchema,
      }),
      // Push Subscription specific routes
      defineRoute({
        url: "/:subscriptionId/logs",
        method: "get",
        handler: PushSubscriptionController.getSubscriptionLogs.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.GetSubscriptionLogsResponseSchema,
      }),
      defineRoute({
        url: "/:subscriptionId/statistics",
        method: "get",
        handler: PushSubscriptionController.getSubscriptionStatistics.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.GetSubscriptionStatisticsResponseSchema,
      }),
      defineRoute({
        url: "/:subscriptionId/deactivate",
        method: "put",
        handler: PushSubscriptionController.deactivateSubscription.bind(
          PushSubscriptionController,
        ),
        ResponseSchema: ResponseSchemas.DeactivateSubscriptionResponseSchema,
      }),
    ],
    description: "Push Subscription routes",
    middlewares: ["session_web"],
    prefix: "push-subscriptions",
  },
];
