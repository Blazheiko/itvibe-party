import { DateTime } from 'luxon';
import type { UserRow } from '#app/repositories/user-repository.js';

export type SerializedUser = Omit<UserRow, 'id' | 'password' | 'isAdmin' | 'createdAt' | 'updatedAt'> & {
    id: number;
    created_at: string | null;
    updated_at: string | null;
};

export const userTransformer = {
    serialize(user: UserRow): SerializedUser {
        const { id, password: _password, isAdmin: _isAdmin, createdAt, updatedAt, ...rest } = user;
        return {
            ...rest,
            id: Number(id),
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
        };
    },

    serializeArray(usersData: UserRow[]): SerializedUser[] {
        return usersData.map((u) => userTransformer.serialize(u));
    },
};
