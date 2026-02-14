import type { Type } from "@arktype/type";
import {
  RegisterInputSchema,
  LoginInputSchema,
  CreateChatInputSchema,
  DeleteChatInputSchema,
  GetMessagesInputSchema,
  SendMessageInputSchema,
  DeleteMessageInputSchema,
  EditMessageInputSchema,
  ReadMessagesInputSchema,
  MarkMessageAsReadInputSchema,
  CreateInvitationInputSchema,
  GetUserInvitationsInputSchema,
  UseInvitationInputSchema,
} from "shared/schemas";

// interface Schema {
//   validator: Type;
// }

const schemas: Record<string, Type> = {
  register: RegisterInputSchema,
  login: LoginInputSchema,
  createChat: CreateChatInputSchema,
  deleteChat: DeleteChatInputSchema,
  getMessages: GetMessagesInputSchema,
  sendMessage: SendMessageInputSchema,
  deleteMessage: DeleteMessageInputSchema,
  editMessage: EditMessageInputSchema,
  readMessages: ReadMessagesInputSchema,
  markMessageAsRead: MarkMessageAsReadInputSchema,
  createInvitation: CreateInvitationInputSchema,
  getUserInvitations: GetUserInvitationsInputSchema,
  useInvitation: UseInvitationInputSchema,
};

export default schemas;
