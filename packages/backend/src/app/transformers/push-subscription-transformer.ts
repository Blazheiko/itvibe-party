import { DateTime } from 'luxon';
import type {
    PushSubscriptionRow,
    PushSubscriptionWithLogs,
} from '#app/repositories/push-subscription-repository.js';

export type SerializedPushSubscription = Omit<
    PushSubscriptionRow,
    'createdAt' | 'updatedAt' | 'lastUsedAt'
> & {
    created_at: string | null;
    updated_at: string | null;
    lastUsedAt: string | null;
};

export type SerializedPushSubscriptionWithLogs = Omit<
    PushSubscriptionWithLogs,
    'createdAt' | 'updatedAt' | 'lastUsedAt'
> & {
    created_at: string | null;
    updated_at: string | null;
    lastUsedAt: string | null;
};

export const pushSubscriptionTransformer = {
    serialize(subscription: PushSubscriptionRow): SerializedPushSubscription {
        const { createdAt, updatedAt, lastUsedAt, ...rest } = subscription;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            lastUsedAt: lastUsedAt !== null ? DateTime.fromJSDate(lastUsedAt).toISO() : null,
        };
    },

    serializeWithLogs(subscription: PushSubscriptionWithLogs): SerializedPushSubscriptionWithLogs {
        const { createdAt, updatedAt, lastUsedAt, ...rest } = subscription;
        return {
            ...rest,
            created_at: DateTime.fromJSDate(createdAt).toISO(),
            updated_at: DateTime.fromJSDate(updatedAt).toISO(),
            lastUsedAt: lastUsedAt !== null ? DateTime.fromJSDate(lastUsedAt).toISO() : null,
        };
    },

    serializeArray(subscriptions: PushSubscriptionRow[]): SerializedPushSubscription[] {
        return subscriptions.map((s) => pushSubscriptionTransformer.serialize(s));
    },

    serializeArrayWithLogs(
        subscriptions: PushSubscriptionWithLogs[],
    ): SerializedPushSubscriptionWithLogs[] {
        return subscriptions.map((s) => pushSubscriptionTransformer.serializeWithLogs(s));
    },
};
