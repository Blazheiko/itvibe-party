import { contactListRepository, messageRepository } from '#app/repositories/index.js';
import { contactListTransformer, messageTransformer } from '#app/transformers/index.js';
import { getOnlineUser } from '#vendor/utils/network/ws-handlers.js';
import { failure, success } from '#app/services/shared/service-result.js';
import { broadcastService } from '#app/services/broadcast-service.js';

function isValidSessionUser(
    payloadUserId: number,
    sessionUserId: string | number | bigint | undefined,
): boolean {
    return Boolean(
        payloadUserId &&
            sessionUserId &&
            Number(payloadUserId) === Number(sessionUserId),
    );
}

export const messageService = {
    async getMessages(payloadUserId: number, contactId: number, sessionUserId: string | number | bigint | undefined) {
        if (!isValidSessionUser(payloadUserId, sessionUserId)) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        if (!contactId) {
            return failure('BAD_REQUEST', 'Contact ID is required');
        }

        const userId = BigInt(payloadUserId);
        const contactBigInt = BigInt(contactId);

        await Promise.all([
            messageRepository.markAllAsRead(userId, contactBigInt),
            contactListRepository.resetUnreadCount(userId, contactBigInt),
        ]);

        const [messages, contacts] = await Promise.all([
            messageRepository.findConversation(userId, contactBigInt),
            contactListRepository.findByUserIdWithDetails(userId),
        ]);

        const contact = contacts.find((item) => item.contactId === contactBigInt);
        if (contact === undefined) {
            return failure('NOT_FOUND', 'Messages not found');
        }

        const onlineUsers = getOnlineUser([String(contactId)]);

        return success({
            messages: messageTransformer.serializeArray(messages),
            contact: contactListTransformer.serializeWithDetails(contact as any),
            onlineUsers,
        });
    },

    async sendChatMessage(
        payloadUserId: number,
        contactId: number,
        content: string,
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!isValidSessionUser(payloadUserId, sessionUserId)) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        if (!contactId || !content) {
            return failure('BAD_REQUEST', 'Contact ID, content and user ID are required');
        }

        const userId = BigInt(payloadUserId);
        const contactBigInt = BigInt(contactId);

        const [senderContacts, receiverContacts] = await Promise.all([
            contactListRepository.findByUserId(userId),
            contactListRepository.findByUserId(contactBigInt),
        ]);

        const senderChat = senderContacts.find((c) => c.contactId === contactBigInt);
        if (senderChat === undefined) {
            return failure('NOT_FOUND', 'Failed to send message');
        }

        const receiverChat = receiverContacts.find((c) => c.contactId === userId);

        const message = await messageRepository.create({
            senderId: userId,
            receiverId: contactBigInt,
            content,
            type: 'TEXT',
        });

        await Promise.all([
            messageRepository.incrementUnreadCount(contactBigInt, userId),
            contactListRepository.update(senderChat.id, {
                lastMessageId: message.id,
                lastMessageAt: new Date(),
            }),
            receiverChat !== undefined
                ? contactListRepository.update(receiverChat.id, {
                      lastMessageId: message.id,
                      lastMessageAt: new Date(),
                  })
                : Promise.resolve(undefined),
        ]);

        broadcastService.broadcastMessageToUser(String(contactId), 'new_message', {
            message,
        });

        return success({ message: messageTransformer.serialize(message) });
    },

    async deleteMessage(
        messageIdValue: string,
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!sessionUserId) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        if (!messageIdValue) {
            return failure('BAD_REQUEST', 'Message ID is required');
        }

        const messageId = BigInt(messageIdValue);
        const userId = BigInt(sessionUserId);

        const message = await messageRepository.findByIdAndUserId(messageId, userId, 'sender');
        if (message === undefined) {
            return failure('NOT_FOUND', 'Message not found or access denied');
        }

        await messageRepository.deleteById(messageId);

        return success({ message: 'Message deleted successfully' });
    },

    async editMessage(
        payloadUserId: number,
        messageId: number,
        content: string,
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!isValidSessionUser(payloadUserId, sessionUserId)) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        if (!messageId || !content) {
            return failure('BAD_REQUEST', 'Message ID and content are required');
        }

        const updatedMessage = await messageRepository.updateContent(
            BigInt(payloadUserId),
            BigInt(messageId),
            content,
        );

        if (updatedMessage === undefined) {
            return failure('NOT_FOUND', 'Message not found or access denied');
        }

        return success({ message: messageTransformer.serialize(updatedMessage) });
    },

    async markAsRead(
        messageIdValue: number,
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!sessionUserId) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        if (!messageIdValue) {
            return failure('BAD_REQUEST', 'Message ID is required');
        }

        const userId = BigInt(sessionUserId);
        const messageId = BigInt(messageIdValue);

        const message = await messageRepository.findByIdAndUserId(messageId, userId, 'receiver');
        if (message === undefined) {
            return failure('NOT_FOUND', 'Message not found or access denied');
        }

        const updated = await messageRepository.markAsRead(messageId, userId);
        if (updated === undefined) {
            return failure('NOT_FOUND', 'Message not found or access denied');
        }

        return success({ message: messageTransformer.serialize(updated) });
    },
};
