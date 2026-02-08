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

interface Schema {
  validator: Type;
}

const schemas: Record<string, Schema> = {
  register: { validator: RegisterInputSchema },
  login: { validator: LoginInputSchema },
  createChat: { validator: CreateChatInputSchema },
  deleteChat: { validator: DeleteChatInputSchema },
  getMessages: { validator: GetMessagesInputSchema },
  sendMessage: { validator: SendMessageInputSchema },
  deleteMessage: { validator: DeleteMessageInputSchema },
  editMessage: { validator: EditMessageInputSchema },
  readMessages: { validator: ReadMessagesInputSchema },
  markMessageAsRead: { validator: MarkMessageAsReadInputSchema },
  createInvitation: { validator: CreateInvitationInputSchema },
  getUserInvitations: { validator: GetUserInvitationsInputSchema },
  useInvitation: { validator: UseInvitationInputSchema },
};

export default schemas;
