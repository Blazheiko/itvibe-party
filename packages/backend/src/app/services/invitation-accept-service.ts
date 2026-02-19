import { db } from '#database/db.js';
import { invitations, contactList } from '#database/schema.js';
import { eq, and } from 'drizzle-orm';

export async function acceptInvitation(token: string, userId: number): Promise<void> {
    if (token === '' || !Number.isFinite(userId) || userId <= 0) return;

    const invitation = await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.token, token), eq(invitations.isUsed, false)))
        .limit(1);

    const invitationItem = invitation.at(0);
    if (invitationItem === undefined || Number(invitationItem.invitedId) === userId) return;

    await db
        .update(invitations)
        .set({
            isUsed: true,
            invitedId: BigInt(userId),
        })
        .where(eq(invitations.id, invitationItem.id));

    const contact = await db
        .select({ id: contactList.id })
        .from(contactList)
        .where(
            and(
                eq(contactList.userId, BigInt(userId)),
                eq(contactList.contactId, invitationItem.userId),
            ),
        )
        .limit(1);

    const now = new Date();
    if (contact.length === 0) {
        await db.insert(contactList).values({
            userId: BigInt(userId),
            contactId: invitationItem.userId,
            status: 'accepted',
            rename: null,
            createdAt: now,
            updatedAt: now,
        });
    }

    const contactOwner = await db
        .select({ id: contactList.id })
        .from(contactList)
        .where(
            and(
                eq(contactList.userId, invitationItem.userId),
                eq(contactList.contactId, BigInt(userId)),
            ),
        )
        .limit(1);

    if (contactOwner.length === 0) {
        await db.insert(contactList).values({
            userId: invitationItem.userId,
            contactId: BigInt(userId),
            status: 'accepted',
            rename: invitationItem.name,
            createdAt: now,
            updatedAt: now,
        });
    }
}
