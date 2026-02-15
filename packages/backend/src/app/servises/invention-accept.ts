import { db } from '#database/db.js';
import { invitations, contactList } from '#database/schema.js';
import { eq, and } from 'drizzle-orm';

export default async (token: string, userId: number): Promise<void> => {
    console.log('inventionAccept');
    if (!token || !userId) return;

    const invention = await db.select()
        .from(invitations)
        .where(and(eq(invitations.token, token), eq(invitations.isUsed, false)))
        .limit(1);

    const inventionItem = invention.at(0);
    if (!inventionItem || Number(inventionItem.invitedId) === userId) return;

    await db.update(invitations)
        .set({
            isUsed: true,
            invitedId: BigInt(userId),
        })
        .where(eq(invitations.id, inventionItem.id));

    const contact = await db.select({ id: contactList.id })
        .from(contactList)
        .where(and(
            eq(contactList.userId, BigInt(userId)),
            eq(contactList.contactId, inventionItem.userId),
        ))
        .limit(1);

    const now = new Date();
    if (contact.length === 0) {
        await db.insert(contactList).values({
            userId: BigInt(userId),
            contactId: inventionItem.userId,
            status: 'accepted',
            rename: null,
            createdAt: now,
            updatedAt: now,
        });
    }

    const contactOwner = await db.select({ id: contactList.id })
        .from(contactList)
        .where(and(
            eq(contactList.userId, inventionItem.userId),
            eq(contactList.contactId, BigInt(userId)),
        ))
        .limit(1);

    if (contactOwner.length === 0) {
        await db.insert(contactList).values({
            userId: inventionItem.userId,
            contactId: BigInt(userId),
            status: 'accepted',
            rename: inventionItem.name,
            createdAt: now,
            updatedAt: now,
        });
    }
};
