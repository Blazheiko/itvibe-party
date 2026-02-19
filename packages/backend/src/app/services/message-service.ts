import { contactListRepository, messageRepository } from '#app/repositories/index.js';
import { contactListTransformer, messageTransformer } from '#app/transformers/index.js';
import { getOnlineUser } from '#vendor/utils/network/ws-handlers.js';
import { failure, success } from '#app/services/shared/service-result.js';
import { broadcastService } from '#app/services/broadcast-service.js';
import { uploadToS3 } from '#vendor/utils/storage/s3.js';
import diskConfig from '#config/disk.js';
import type { UploadedFile } from '#vendor/types/types.js';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

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

function resolveImageMimeType(file: UploadedFile): string {
    const mimeTypeFromExt = (() => {
        const ext = path.extname(file.filename).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
        if (ext === '.png') return 'image/png';
        if (ext === '.webp') return 'image/webp';
        if (ext === '.gif') return 'image/gif';
        if (ext === '.heic') return 'image/heic';
        if (ext === '.heif') return 'image/heif';
        return '';
    })();

    return (file.type || mimeTypeFromExt).toLowerCase();
}

async function uploadChatImageToS3(
    file: UploadedFile,
    directory: 'chat-images' | 'chat-thumbnails',
): Promise<{ key: string; mimeType: string }> {
    const extname = path.extname(file.filename);
    const ext = extname === '' ? '.bin' : extname;
    const uniqueName = `${randomUUID()}${ext}`;
    const prefix = (diskConfig.s3DynamicDataPrefix ?? 'uploads')
        .replace(/^\/+|\/+$/g, '');
    const s3Key = `${prefix}/${directory}/${uniqueName}`;
    const mimeType = resolveImageMimeType(file);

    await uploadToS3(s3Key, Buffer.from(file.data), mimeType);
    return { key: s3Key, mimeType };
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
        options: {
            type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
            file?: UploadedFile;
            thumbnailFile?: UploadedFile;
        } = {},
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!Number.isInteger(payloadUserId) || payloadUserId <= 0) {
            return failure('BAD_REQUEST', 'User ID is required');
        }

        if (!Number.isInteger(contactId) || contactId <= 0) {
            return failure('BAD_REQUEST', 'Contact ID is required');
        }

        if (!isValidSessionUser(payloadUserId, sessionUserId)) {
            return failure('UNAUTHORIZED', 'Session expired');
        }

        const userId = BigInt(payloadUserId);
        const contactBigInt = BigInt(contactId);
        const requestedType = options.type ?? (options.file ? 'IMAGE' : 'TEXT');
        const normalizedType = String(requestedType).trim().toUpperCase();
        let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | null = null;
        if (
            normalizedType === 'TEXT' ||
            normalizedType === 'IMAGE' ||
            normalizedType === 'VIDEO' ||
            normalizedType === 'AUDIO'
        ) {
            messageType = normalizedType;
        }

        if (messageType === null) {
            return failure('BAD_REQUEST', 'Unsupported message type');
        }

        if (options.file !== undefined && messageType !== 'IMAGE') {
            return failure('BAD_REQUEST', 'File upload is supported only for IMAGE messages');
        }

        let messageContent = content.trim();
        let messageSrc: string | undefined;
        let messageThumbnail: string | undefined;

        if (messageType === 'IMAGE') {
            const file = options.file;
            if (file === undefined) {
                return failure('BAD_REQUEST', 'Image file is required');
            }

            const allowedMimeTypes = new Set([
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/gif',
                'image/heic',
                'image/heif',
            ]);

            const normalizedFileType = resolveImageMimeType(file);

            if (!allowedMimeTypes.has(normalizedFileType)) {
                return failure('BAD_REQUEST', 'Unsupported image format');
            }

            const fileSize = file.data.byteLength;
            const maxFileSizeBytes = 10 * 1024 * 1024;
            if (fileSize <= 0) {
                return failure('BAD_REQUEST', 'Uploaded file is empty');
            }
            if (fileSize > maxFileSizeBytes) {
                return failure('BAD_REQUEST', 'Image exceeds 10MB limit');
            }

            const uploadedOriginal = await uploadChatImageToS3(file, 'chat-images');
            messageSrc = uploadedOriginal.key;

            const thumbnailFile = options.thumbnailFile;
            if (thumbnailFile !== undefined) {
                const normalizedThumbnailType = resolveImageMimeType(thumbnailFile);
                if (!allowedMimeTypes.has(normalizedThumbnailType)) {
                    return failure('BAD_REQUEST', 'Unsupported thumbnail format');
                }

                const thumbnailSize = thumbnailFile.data.byteLength;
                const maxThumbnailSizeBytes = 2 * 1024 * 1024;
                if (thumbnailSize <= 0) {
                    return failure('BAD_REQUEST', 'Uploaded thumbnail is empty');
                }
                if (thumbnailSize > maxThumbnailSizeBytes) {
                    return failure('BAD_REQUEST', 'Thumbnail exceeds 2MB limit');
                }

                const uploadedThumbnail = await uploadChatImageToS3(
                    thumbnailFile,
                    'chat-thumbnails',
                );
                messageThumbnail = uploadedThumbnail.key;
            } else {
                messageThumbnail = messageSrc;
            }
        } else {
            if (messageContent.length === 0) {
                return failure('BAD_REQUEST', 'Message content is required');
            }
        }

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
            content: messageContent,
            type: messageType,
            src: messageSrc,
            thumbnail: messageThumbnail,
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
