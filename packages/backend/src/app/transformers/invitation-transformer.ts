import { DateTime } from 'luxon';
import type { InvitationRow, InvitationWithInvited } from '#app/repositories/invitation-repository.js';

export type SerializedInvitation = Omit<InvitationRow, 'createdAt' | 'updatedAt' | 'expiresAt'> & {
    created_at: string | null;
    updated_at: string | null;
    expiresAt: string | null;
};

export type SerializedInvitationWithInvited = Omit<
    InvitationWithInvited,
    'createdAt' | 'updatedAt' | 'expiresAt'
> & {
    created_at: string | null;
    updated_at: string | null;
    expiresAt: string | null;
};

export const invitationTransformer = {
    serialize(invitation: InvitationRow): SerializedInvitation {
        const { createdAt, updatedAt, expiresAt, ...rest } = invitation;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            expiresAt: DateTime.fromJSDate(expiresAt).toISO(),
        };
    },

    serializeWithInvited(invitation: InvitationWithInvited): SerializedInvitationWithInvited {
        const { createdAt, updatedAt, expiresAt, ...rest } = invitation;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            expiresAt: DateTime.fromJSDate(expiresAt).toISO(),
        };
    },

    serializeArray(invitations: InvitationRow[]): SerializedInvitation[] {
        return invitations.map((i) => invitationTransformer.serialize(i));
    },

    serializeArrayWithInvited(
        invitations: InvitationWithInvited[],
    ): SerializedInvitationWithInvited[] {
        return invitations.map((i) => invitationTransformer.serializeWithInvited(i));
    },
};
