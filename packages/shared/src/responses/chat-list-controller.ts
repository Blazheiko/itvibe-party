export interface User {
  id: bigint;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: bigint;
  content: string;
  senderId: bigint;
  receiverId: bigint;
  created_at: string | null;
  updated_at: string | null;
  isRead: boolean;
  type: unknown;
  src: string | null;
  calendarId: bigint | null;
  taskId: bigint | null;
}

export interface Contact {
  id: bigint;
  userId: bigint;
  contactId: bigint;
  status: string;
  unreadCount: number;
  rename: string | null;
  lastMessageId: bigint | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  contact: {
    id: bigint | null;
    name: string | null;
  } | null;
  lastMessage?: {
    id: bigint;
    content: string;
    senderId: bigint;
    receiverId: bigint;
    createdAt: Date;
    updatedAt: Date;
    type: unknown;
    src: string | null;
    isRead: boolean;
    calendarId: bigint | null;
    taskId: bigint | null;
  } | null;
}

export interface ContactList {
  id: bigint;
  userId: bigint;
  contactId: bigint;
  status: string;
  unreadCount: number;
  rename: string | null;
  lastMessageId: bigint | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
}

export interface GetContactListResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | string | null;
  contactList?: Contact[] | null;
  onlineUsers?: string[];
}

export interface CreateChatResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | string | null;
  chat?: ContactList | null;
}

export interface DeleteChatResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | string | null;
}

export interface GetMessagesResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: string;
  messages?: Message[];
  contact?: unknown;
  onlineUsers?: string[];
}

export interface SendMessageResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | null | string;
}

export interface DeleteMessageResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | string | null;
}

export interface EditMessageResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | null | string;
}

export interface MarkAsReadResponse {
  status: 'ok' | 'error' | 'unauthorized';
  message?: Message | string | null;
}

export type MarkMessageAsReadResponse = MarkAsReadResponse;
