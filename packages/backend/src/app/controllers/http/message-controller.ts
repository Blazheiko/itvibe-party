import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import sendMessage from "#app/servises/chat/send-message.js";
import getChatMessages from "#app/servises/chat/get-chat-messages.js";
import Message from "#app/models/Message.js";
import type {
  GetMessagesResponse,
  SendMessageResponse,
  DeleteMessageResponse,
  EditMessageResponse,
  MarkAsReadResponse,
} from "../types/ChatListController.js";
import type {
  EditMessageInput,
  GetMessagesInput,
  MarkMessageAsReadInput,
  SendMessageInput,
} from "shared/schemas";

export default {
  async getMessages(
    context: HttpContext<GetMessagesInput>,
  ): Promise<GetMessagesResponse> {
    const { session, logger } = context;
    logger.info("getMessages");
    const sessionInfo = session?.sessionInfo;
    if (!sessionInfo) {
      return { status: "error", message: "Session not found" };
    }
    const { contactId, userId } = getTypedPayload(context);
    const sessionUserId = sessionInfo.data?.userId;
    if (!userId || !sessionUserId || Number(userId) !== Number(sessionUserId)) {
      return { status: "unauthorized", message: "Session expired" };
    }

    if (!contactId) {
      return { status: "error", message: "Contact ID is required" };
    }

    const data = await getChatMessages(BigInt(userId), BigInt(contactId));
    if (!data) {
      return { status: "error", message: "Messages not found" };
    }

    return { status: "ok", ...data };
  },

  async sendChatMessage(
    context: HttpContext<SendMessageInput>,
  ): Promise<SendMessageResponse> {
    const { session, logger } = context;
    logger.info("sendChatMessage");
    const sessionInfo = session?.sessionInfo;
    if (!sessionInfo) {
      return { status: "error", message: "Session not found" };
    }
    const sessionUserId = sessionInfo.data?.userId;
    if (!sessionUserId) {
      return { status: "unauthorized", message: "Session expired" };
    }

    const payload = getTypedPayload(context);
    const { contactId, content, userId } = payload;
    logger.info(payload);
    logger.info({ userId });
    if (
      !contactId ||
      !content ||
      !userId ||
      Number(userId) !== Number(sessionUserId)
    ) {
      return {
        status: "error",
        message: "Contact ID, content and user ID are required",
      };
    }

    const message = await sendMessage(content, String(userId), String(contactId));
    if (!message) {
      return { status: "error", message: "Failed to send message" };
    }

    return { status: "ok", message };
  },

  async deleteMessage({
    session,
    httpData,
    logger,
  }: HttpContext): Promise<DeleteMessageResponse> {
    logger.info("deleteMessage");
    const sessionInfo = session?.sessionInfo;
    if (!sessionInfo) {
      return { status: "error", message: "Session not found" };
    }
    const userId = sessionInfo.data?.userId;
    if (!userId) {
      return { status: "unauthorized", message: "Session expired" };
    }

    const { messageId } = httpData.params;
    if (!messageId) {
      return { status: "error", message: "Message ID is required" };
    }

    const messageBigIntId = BigInt(messageId);
    const sessionUserBigInt = BigInt(userId);
    const message = await Message.findByIdAndUserId(
      messageBigIntId,
      sessionUserBigInt,
      "sender",
    );
    if (!message) {
      return {
        status: "error",
        message: "Message not found or access denied",
      };
    }

    await Message.deleteById(messageBigIntId);

    return { status: "ok", message: "Message deleted successfully" };
  },

  async editMessage(
    context: HttpContext<EditMessageInput>,
  ): Promise<EditMessageResponse> {
    const { session, logger } = context;
    logger.info("editMessage");
    const sessionInfo = session?.sessionInfo;
    if (!sessionInfo) {
      return { status: "error", message: "Session not found" };
    }
    const { messageId, content, userId } = getTypedPayload(context);
    const sessionUserId = sessionInfo.data?.userId;
    if (!userId || !sessionUserId || Number(userId) !== Number(sessionUserId)) {
      return { status: "unauthorized", message: "Session expired" };
    }

    if (!messageId || !content) {
      return {
        status: "error",
        message: "Message ID and content are required",
      };
    }

    // const message = await Message.findByIdAndUserId(messageId, userId, 'sender');
    // if (!message) {
    //     return { status: 'error', message: 'Message not found or access denied' };
    // }

    const updatedMessage = await Message.updateContent(
      BigInt(userId),
      BigInt(messageId),
      content,
    );

    return {
      status: updatedMessage ? "ok" : "error",
      message: updatedMessage,
    };
  },

  async markAsRead(
    context: HttpContext<MarkMessageAsReadInput>,
  ): Promise<MarkAsReadResponse> {
    const { session, logger } = context;
    logger.info("markAsRead");
    const sessionInfo = session?.sessionInfo;
    if (!sessionInfo) {
      return { status: "error", message: "Session not found" };
    }
    const userId = sessionInfo.data?.userId;
    if (!userId) {
      return { status: "unauthorized", message: "Session expired" };
    }

    const { messageId } = getTypedPayload(context);
    if (!messageId) {
      return { status: "error", message: "Message ID is required" };
    }

    const message = await Message.findByIdAndUserId(
      BigInt(messageId),
      BigInt(userId),
      "receiver",
    );
    if (!message) {
      return {
        status: "error",
        message: "Message not found or access denied",
      };
    }

    try {
      const result = await Message.markAsRead(BigInt(messageId), BigInt(userId));
      return { status: "ok", message: result };
    } catch (error) {
      logger.error({ err: error }, "Error marking message as read:");
      return {
        status: "error",
        message: "Failed to mark message as read",
      };
    }
  },
};
