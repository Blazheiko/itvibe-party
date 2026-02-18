import { randomUUID } from 'node:crypto';
import { invitationRepository } from '#app/repositories/index.js';
import { invitationTransformer } from '#app/transformers/index.js';
import { failure, success } from '#app/services/shared/service-result.js';
import { acceptInvitation } from '#app/services/invitation-accept-service.js';
import type { Session } from '#vendor/types/types.js';

export const invitationService = {
    async createInvitation(
        userId: number,
        name: string,
        sessionUserId: string | number | bigint | undefined,
    ) {
        if (!userId || !sessionUserId || Number(userId) !== Number(sessionUserId) || !name) {
            return failure('BAD_REQUEST', 'User ID is required');
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const createdInvitation = await invitationRepository.create({
            name,
            token: Buffer.from(randomUUID()).toString('base64'),
            userId: BigInt(userId),
            expiresAt,
        });

        return success({
            token: createdInvitation.token,
            invitation: invitationTransformer.serialize(createdInvitation),
        });
    },

    async getUserInvitations(userId: number) {
        if (!userId) {
            return failure('BAD_REQUEST', 'User ID is required');
        }

        const invitations = await invitationRepository.findByUserId(BigInt(userId));
        return success({
            invitations: invitationTransformer.serializeArrayWithInvited(invitations),
        });
    },

    async useInvitation(token: string, session: Session) {
        if (!token) {
            return failure('BAD_REQUEST', 'Token are required');
        }

        let status: 'success' | 'error' | 'awaiting' = 'awaiting';

        const sessionInfo = session.sessionInfo;
        if (sessionInfo !== null) {
            const userId = sessionInfo.data?.['userId'];
            if (userId) {
                await acceptInvitation(token, Number(userId));
                status = 'success';
            } else {
                await session.updateSessionData({ inventionToken: token });
            }
        }

        return success({ status });
    },
};
