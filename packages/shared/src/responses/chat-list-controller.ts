import { type } from "@arktype/type";

export const UserSchema = type({
  id: "bigint",
  name: "string",
  email: "string",
  password: "string",
  phone: "string | null",
  isAdmin: "boolean",
  createdAt: "Date",
  updatedAt: "Date",
});
export type User = typeof UserSchema.infer;

export const MessageSchema = type({
  id: "bigint",
  content: "string",
  senderId: "bigint",
  receiverId: "bigint",
  created_at: "string | null",
  updated_at: "string | null",
  isRead: "boolean",
  type: "unknown",
  src: "string | null",
  calendarId: "bigint | null",
  taskId: "bigint | null",
});
export type Message = typeof MessageSchema.infer;

export const ContactSchema = type({
  id: "bigint",
  userId: "bigint",
  contactId: "bigint",
  status: "string",
  unreadCount: "number",
  rename: "string | null",
  lastMessageId: "bigint | null",
  created_at: "string | null",
  updated_at: "string | null",
  last_message_at: "string | null",
  contact: {
    id: "bigint | null",
    name: "string | null",
  },
  "lastMessage?": {
    id: "bigint",
    content: "string",
    senderId: "bigint",
    receiverId: "bigint",
    createdAt: "Date",
    updatedAt: "Date",
    type: "unknown",
    src: "string | null",
    isRead: "boolean",
    calendarId: "bigint | null",
    taskId: "bigint | null",
  },
});
export type Contact = typeof ContactSchema.infer;

export const ContactListSchema = type({
  id: "bigint",
  userId: "bigint",
  contactId: "bigint",
  status: "string",
  unreadCount: "number",
  rename: "string | null",
  lastMessageId: "bigint | null",
  created_at: "string | null",
  updated_at: "string | null",
  last_message_at: "string | null",
});
export type ContactList = typeof ContactListSchema.infer;

export const GetContactListResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
  "contactList?": "unknown[] | null",
  "onlineUsers?": "string[]",
});
export type GetContactListResponse = typeof GetContactListResponseSchema.infer;

export const CreateChatResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
  "chat?": "unknown | null",
});
export type CreateChatResponse = typeof CreateChatResponseSchema.infer;

export const DeleteChatResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
});
export type DeleteChatResponse = typeof DeleteChatResponseSchema.infer;

export const GetMessagesResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "string",
  "messages?": "unknown[]",
  "contact?": "unknown",
  "onlineUsers?": "string[]",
});
export type GetMessagesResponse = typeof GetMessagesResponseSchema.infer;

export const SendMessageResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
});
export type SendMessageResponse = typeof SendMessageResponseSchema.infer;

export const DeleteMessageResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
});
export type DeleteMessageResponse = typeof DeleteMessageResponseSchema.infer;

export const EditMessageResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
});
export type EditMessageResponse = typeof EditMessageResponseSchema.infer;

export const MarkAsReadResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "unknown",
});
export type MarkAsReadResponse = typeof MarkAsReadResponseSchema.infer;

export const MarkMessageAsReadResponseSchema = MarkAsReadResponseSchema;
export type MarkMessageAsReadResponse = MarkAsReadResponse;
