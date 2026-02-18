import { DateTime } from 'luxon';
import type { MessageRow } from '#app/repositories/message-repository.js';

export type SerializedMessage = Omit<MessageRow, 'createdAt' | 'updatedAt'> & {
    created_at: string | null;
    updated_at: string | null;
};

export const messageTransformer = {
    serialize(message: MessageRow): SerializedMessage {
        const { createdAt, updatedAt, ...rest } = message;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
        };
    },

    serializeArray(messagesList: MessageRow[]): SerializedMessage[] {
        return messagesList.map((m) => messageTransformer.serialize(m));
    },
};
