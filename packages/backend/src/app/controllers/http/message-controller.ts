import type { HttpContext } from '#vendor/types/types.js';
import { getTypedPayload } from '#vendor/utils/validation/get-typed-payload.js';
import { messageService } from '#app/services/message-service.js';
import type {
    GetMessagesResponse,
    SendMessageResponse,
    DeleteMessageResponse,
    EditMessageResponse,
    MarkAsReadResponse,
} from '../types/ChatListController.js';
import type {
    EditMessageInput,
    GetMessagesInput,
    MarkMessageAsReadInput,
    SendMessageInput,
} from 'shared/schemas';

function setServiceErrorStatus(
    context: HttpContext,
    code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL',
): void {
    if (code === 'BAD_REQUEST') {
        context.responseData.status = 400;
        return;
    }
    if (code === 'UNAUTHORIZED') {
        context.responseData.status = 401;
        return;
    }
    if (code === 'NOT_FOUND') {
        context.responseData.status = 404;
        return;
    }
    if (code === 'CONFLICT') {
        context.responseData.status = 409;
        return;
    }
    context.responseData.status = 500;
}

function mapStatus(code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL') {
    return code === 'UNAUTHORIZED' ? 'unauthorized' : 'error';
}

export default {
    async getMessages(
        context: HttpContext<GetMessagesInput>,
    ): Promise<GetMessagesResponse> {
        context.logger.info('getMessages');

        const sessionInfo = context.session.sessionInfo;
        if (!sessionInfo) {
            return { status: 'error', message: 'Session not found' };
        }

        const { contactId, userId } = getTypedPayload(context);
        const result = await messageService.getMessages(
            userId,
            contactId,
            sessionInfo.data?.userId,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: mapStatus(result.code), message: result.message };
        }

        return {
            status: 'ok',
            messages: result.data.messages as any,
            contact: result.data.contact,
            onlineUsers: result.data.onlineUsers,
        };
    },

    async sendChatMessage(
        context: HttpContext<SendMessageInput>,
    ): Promise<SendMessageResponse> {
        context.logger.info('sendChatMessage');

        const sessionInfo = context.session.sessionInfo;
        if (!sessionInfo) {
            return { status: 'error', message: 'Session not found' };
        }

        const { contactId, content, userId } = getTypedPayload(context);
        const result = await messageService.sendChatMessage(
            userId,
            contactId,
            content,
            sessionInfo.data?.userId,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: mapStatus(result.code), message: result.message };
        }

        return { status: 'ok', message: result.data.message as any };
    },

    async deleteMessage(context: HttpContext): Promise<DeleteMessageResponse> {
        context.logger.info('deleteMessage');

        const sessionInfo = context.session.sessionInfo;
        if (!sessionInfo) {
            return { status: 'error', message: 'Session not found' };
        }

        const { messageId } = context.httpData.params;
        if (!messageId) {
            return { status: 'error', message: 'Message ID is required' };
        }

        const result = await messageService.deleteMessage(
            messageId,
            sessionInfo.data?.userId,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: mapStatus(result.code), message: result.message };
        }

        return { status: 'ok', message: result.data.message };
    },

    async editMessage(
        context: HttpContext<EditMessageInput>,
    ): Promise<EditMessageResponse> {
        context.logger.info('editMessage');

        const sessionInfo = context.session.sessionInfo;
        if (!sessionInfo) {
            return { status: 'error', message: 'Session not found' };
        }

        const { messageId, content, userId } = getTypedPayload(context);
        const result = await messageService.editMessage(
            userId,
            messageId,
            content,
            sessionInfo.data?.userId,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: mapStatus(result.code), message: result.message };
        }

        return { status: 'ok', message: result.data.message as any };
    },

    async markAsRead(
        context: HttpContext<MarkMessageAsReadInput>,
    ): Promise<MarkAsReadResponse> {
        context.logger.info('markAsRead');

        const sessionInfo = context.session.sessionInfo;
        if (!sessionInfo) {
            return { status: 'error', message: 'Session not found' };
        }

        const { messageId } = getTypedPayload(context);
        const result = await messageService.markAsRead(
            messageId,
            sessionInfo.data?.userId,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: mapStatus(result.code), message: result.message };
        }

        return { status: 'ok', message: result.data.message as any };
    },
};
