import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import { messageService } from "#app/services/message-service.js";
import type { UploadedFile } from "#vendor/types/types.js";
import type {
  GetMessagesResponse,
  SendMessageResponse,
  DeleteMessageResponse,
  EditMessageResponse,
  MarkAsReadResponse,
} from "shared";
import type {
  EditMessageInput,
  GetMessagesInput,
  MarkMessageAsReadInput,
  SendMessageInput,
} from "shared/schemas";

function setServiceErrorStatus(
  context: HttpContext,
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "INTERNAL",
): void {
  if (code === "BAD_REQUEST") {
    context.responseData.status = 400;
    return;
  }
  if (code === "UNAUTHORIZED") {
    context.responseData.status = 401;
    return;
  }
  if (code === "NOT_FOUND") {
    context.responseData.status = 404;
    return;
  }
  if (code === "CONFLICT") {
    context.responseData.status = 409;
    return;
  }
  context.responseData.status = 500;
}

function mapStatus(
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "INTERNAL",
): "ok" | "error" | "unauthorized" {
  return code === "UNAUTHORIZED" ? "unauthorized" : "error";
}

function parseMessageType(
  value: unknown,
): "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "TEXT" ||
    normalized === "IMAGE" ||
    normalized === "VIDEO" ||
    normalized === "AUDIO" ||
    normalized === "FILE"
  ) {
    return normalized;
  }
  return undefined;
}

function toPositiveInt(value: unknown): number | null {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
}

export default {
  async getMessages(
    context: HttpContext<GetMessagesInput>,
  ): Promise<GetMessagesResponse> {
    context.logger.info("getMessages");

    const sessionInfo = context.session.sessionInfo;
    if (sessionInfo === null) {
      return { status: "error", message: "Session not found" };
    }

    const { contactId, userId } = getTypedPayload(context);
    const result = await messageService.getMessages(
      userId,
      contactId,
      sessionInfo.data.userId,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      return { status: mapStatus(result.code), message: result.message };
    }

    return {
      status: "ok",
      messages: result.data.messages,
      contact: result.data.contact,
      onlineUsers: result.data.onlineUsers,
    };
  },

  async sendChatMessage(
    context: HttpContext<SendMessageInput>,
  ): Promise<SendMessageResponse> {
    const { logger, httpData, responseData, session } = context;
    logger.info(
      {
        contentType: httpData.contentType,
        hasPayload: httpData.payload !== null,
        hasFiles: httpData.files !== null,
        fileKeys:
          httpData.files !== null ? Array.from(httpData.files.keys()) : [],
      },
      "sendChatMessage: request received",
    );

    const sessionInfo = session.sessionInfo;
    if (sessionInfo === null) {
      logger.warn("sendChatMessage: session not found");
      return { status: "error", message: "Session not found" };
    }

    let contactId: number;
    let content: string;
    let userId: number;
    let type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | undefined;
    let file: UploadedFile | undefined;
    let thumbnailFile: UploadedFile | undefined;
    if (httpData.files !== null && httpData.files.size > 0) {
      const payload = (httpData.payload ?? {}) as Record<string, unknown>;
      const sessionUserId = toPositiveInt(sessionInfo.data.userId);

      contactId = toPositiveInt(payload["contactId"]) ?? 0;
      content = String(payload["content"]);
      userId = toPositiveInt(payload["userId"]) ?? sessionUserId ?? 0;
      type = parseMessageType(payload["type"]);
      file =
        httpData.files.get("media") ??
        httpData.files.get("image") ??
        httpData.files.get("audio") ??
        httpData.files.get("video") ??
        httpData.files.values().next().value;
      thumbnailFile = httpData.files.get("thumbnail");
      logger.info(
        {
          mode: "multipart",
          payloadKeys: Object.keys(payload),
          parsed: {
            userId,
            contactId,
            contentLength: content.length,
            rawType: payload["type"],
            type,
            hasFile: file !== undefined,
            fileName: file?.filename,
            fileType: file?.type,
            fileSize: file?.data.byteLength,
            hasThumbnailFile: thumbnailFile !== undefined,
            thumbnailFileName: thumbnailFile?.filename,
            thumbnailFileType: thumbnailFile?.type,
            thumbnailFileSize: thumbnailFile?.data.byteLength,
          },
        },
        "sendChatMessage: multipart payload parsed",
      );
    } else {
      const payload = getTypedPayload(context);
      contactId = payload.contactId;
      content = payload.content;
      userId = payload.userId;
      type = payload.type;
    }

    const sendOptions: {
      type?: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
      file?: UploadedFile;
      thumbnailFile?: UploadedFile;
    } = {};
    if (type !== undefined) {
      sendOptions.type = type;
    }
    if (file !== undefined) {
      sendOptions.file = file;
    }
    if (thumbnailFile !== undefined) {
      sendOptions.thumbnailFile = thumbnailFile;
    }

    let result: Awaited<ReturnType<typeof messageService.sendChatMessage>>;
    try {
      result = await messageService.sendChatMessage(
        userId,
        contactId,
        content,
        sendOptions,
        sessionInfo.data.userId,
      );
    } catch (error) {
      logger.error({ err: error }, "sendChatMessage: service threw exception");
      responseData.status = 500;
      return {
        status: "error",
        message: "Internal server error while sending message",
      };
    }

    if (!result.ok) {
      logger.warn(
        { code: result.code, message: result.message },
        "sendChatMessage: service returned failure",
      );
      setServiceErrorStatus(context, result.code);
      return { status: mapStatus(result.code), message: result.message };
    }

    logger.info(
      {
        messageId: result.data.message.id,
        type: result.data.message.type,
        src: result.data.message.src,
        thumbnail: result.data.message.thumbnail,
      },
      "sendChatMessage: success",
    );
    return { status: "ok", message: result.data.message };
  },

  async deleteMessage(context: HttpContext): Promise<DeleteMessageResponse> {
    const { logger, httpData, session } = context;
    logger.info("deleteMessage");

    const sessionInfo = session.sessionInfo;
    if (sessionInfo === null) {
      return { status: "error", message: "Session not found" };
    }

    const { messageId } = httpData.params;
    if (messageId === undefined) {
      return { status: "error", message: "Message ID is required" };
    }

    const result = await messageService.deleteMessage(
      messageId,
      sessionInfo.data.userId,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      return { status: mapStatus(result.code), message: result.message };
    }

    return { status: "ok", message: result.data.message };
  },

  async editMessage(
    context: HttpContext<EditMessageInput>,
  ): Promise<EditMessageResponse> {
    const { logger, session } = context;
    logger.info("editMessage");

    const sessionInfo = session.sessionInfo;
    if (sessionInfo === null) {
      return { status: "error", message: "Session not found" };
    }

    const { messageId, content, userId } = getTypedPayload(context);
    const result = await messageService.editMessage(
      userId,
      messageId,
      content,
      sessionInfo.data.userId,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      return { status: mapStatus(result.code), message: result.message };
    }

    return { status: "ok", message: result.data.message };
  },

  async markAsRead(
    context: HttpContext<MarkMessageAsReadInput>,
  ): Promise<MarkAsReadResponse> {
    const { logger, session } = context;
    logger.info("markAsRead");

    const sessionInfo = session.sessionInfo;
    if (sessionInfo === null) {
      return { status: "error", message: "Session not found" };
    }

    const { messageId } = getTypedPayload(context);
    const result = await messageService.markAsRead(
      messageId,
      sessionInfo.data.userId,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      return { status: mapStatus(result.code), message: result.message };
    }

    return { status: "ok", message: result.data.message };
  },
};
