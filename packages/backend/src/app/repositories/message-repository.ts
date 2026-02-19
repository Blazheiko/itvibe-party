import { db } from '#database/db.js';
import { contactList, messages } from '#database/schema.js';
import { and, eq, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type MessageRow = InferSelectModel<typeof messages>;
export type MessageInsert = InferInsertModel<typeof messages>;
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

export interface IMessageRepository {
    create(data: MessageInsert): Promise<MessageRow>;
    findById(id: bigint): Promise<MessageRow | undefined>;
    findByIdAndUserId(
        id: bigint,
        userId: bigint,
        userType: 'sender' | 'receiver',
    ): Promise<MessageRow | undefined>;
    findConversation(userId1: bigint, userId2: bigint): Promise<MessageRow[]>;
    markAllAsRead(userId: bigint, contactId: bigint): Promise<void>;
    markAsRead(messageId: bigint, userId: bigint): Promise<MessageRow | undefined>;
    getUnreadCount(userId: bigint): Promise<number>;
    deleteById(id: bigint): Promise<boolean>;
    updateContent(userId: bigint, id: bigint, content: string): Promise<MessageRow | undefined>;
    incrementUnreadCount(receiverId: bigint, senderId: bigint): Promise<void>;
    decrementUnreadCount(userId: bigint, contactId: bigint): Promise<void>;
}

export const messageRepository: IMessageRepository = {
    async create(data) {
        const now = new Date();
        const [result] = await db.insert(messages).values({
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        const created = await db
            .select()
            .from(messages)
            .where(eq(messages.id, BigInt(result.insertId)))
            .limit(1)
            .then((rows) => rows.at(0));
        if (created === undefined) {
            throw new Error('Failed to create message');
        }
        return created;
    },

    async findById(id) {
        return await db
            .select()
            .from(messages)
            .where(eq(messages.id, id))
            .limit(1)
            .then((rows) => rows.at(0));
    },

    async findByIdAndUserId(id, userId, userType) {
        const condition =
            userType === 'sender'
                ? and(eq(messages.id, id), eq(messages.senderId, userId))
                : and(eq(messages.id, id), eq(messages.receiverId, userId));
        return await db
            .select()
            .from(messages)
            .where(condition)
            .limit(1)
            .then((rows) => rows.at(0));
    },

    async findConversation(userId1, userId2) {
        return await db
            .select()
            .from(messages)
            .where(
                or(
                    and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
                    and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1)),
                ),
            )
            .orderBy(messages.createdAt);
    },

    async markAllAsRead(userId, contactId) {
        await db
            .update(messages)
            .set({ isRead: true })
            .where(and(eq(messages.senderId, contactId), eq(messages.receiverId, userId)));
    },

    async markAsRead(messageId, userId) {
        const message = await messageRepository.findById(messageId);
        if (message === undefined || message.receiverId !== userId) {
            return undefined;
        }
        await db
            .update(messages)
            .set({ isRead: true })
            .where(eq(messages.id, messageId));
        return messageRepository.findById(messageId);
    },

    async getUnreadCount(userId) {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
        return result.at(0)?.count ?? 0;
    },

    async deleteById(id) {
        const result = await db.delete(messages).where(eq(messages.id, id));
        return result[0].affectedRows > 0;
    },

    async updateContent(userId, id, content) {
        await db
            .update(messages)
            .set({ content, updatedAt: new Date() })
            .where(and(eq(messages.id, id), eq(messages.senderId, userId)));
        return messageRepository.findById(id);
    },

    async incrementUnreadCount(receiverId, senderId) {
        await db
            .update(contactList)
            .set({ unreadCount: sql`${contactList.unreadCount} + 1` })
            .where(
                and(eq(contactList.userId, receiverId), eq(contactList.contactId, senderId)),
            );
    },

    async decrementUnreadCount(userId, contactId) {
        await db
            .update(contactList)
            .set({ unreadCount: sql`${contactList.unreadCount} - 1` })
            .where(
                and(eq(contactList.userId, userId), eq(contactList.contactId, contactId)),
            );
    },
};
