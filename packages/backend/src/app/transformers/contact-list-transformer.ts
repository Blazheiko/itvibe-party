import { DateTime } from 'luxon';
import type { ContactListRow, ContactListWithDetails } from '#app/repositories/contact-list-repository.js';

export type SerializedContactList = Omit<
    ContactListRow,
    'createdAt' | 'updatedAt' | 'lastMessageAt'
> & {
    created_at: string | null;
    updated_at: string | null;
    last_message_at: string | null;
};

export type SerializedContactListWithDetails = Omit<
    ContactListWithDetails,
    'createdAt' | 'updatedAt' | 'lastMessageAt'
> & {
    created_at: string | null;
    updated_at: string | null;
    last_message_at: string | null;
};

export const contactListTransformer = {
    serialize(contact: ContactListRow): SerializedContactList {
        const { createdAt, updatedAt, lastMessageAt, ...rest } = contact;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            last_message_at: DateTime.fromJSDate(lastMessageAt).toISO(),
        };
    },

    serializeWithDetails(contact: ContactListWithDetails): SerializedContactListWithDetails {
        const { createdAt, updatedAt, lastMessageAt, ...rest } = contact;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            last_message_at: DateTime.fromJSDate(lastMessageAt).toISO(),
        };
    },

    serializeArray(contacts: ContactListRow[]): SerializedContactList[] {
        return contacts.map((c) => contactListTransformer.serialize(c));
    },

    serializeArrayWithDetails(contacts: ContactListWithDetails[]): SerializedContactListWithDetails[] {
        return contacts.map((c) => contactListTransformer.serializeWithDetails(c));
    },
};
