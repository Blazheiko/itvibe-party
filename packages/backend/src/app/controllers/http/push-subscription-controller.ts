import type { HttpContext } from '#vendor/types/types.js';
import { getTypedPayload } from '#vendor/utils/validation/get-typed-payload.js';
import { pushSubscriptionService } from '#app/services/push-subscription-service.js';
import type {
    GetSubscriptionsResponse,
    CreateSubscriptionResponse,
    GetSubscriptionResponse,
    UpdateSubscriptionResponse,
    DeleteSubscriptionResponse,
    GetSubscriptionLogsResponse,
    GetSubscriptionStatisticsResponse,
    DeactivateSubscriptionResponse,
} from 'shared';
import type {
    CreateSubscriptionInput,
    UpdateSubscriptionInput,
} from 'shared/schemas';

function setServiceErrorStatus(
    context: HttpContext,
    code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL',
): void {
    if (code === 'BAD_REQUEST') {
        context.responseData.status = 400;
        return;
    }
    if (code === 'UNAUTHORIZED') {
        context.responseData.status = 401;
        return;
    }
    if (code === 'NOT_FOUND') {
        context.responseData.status = 404;
        return;
    }
    if (code === 'CONFLICT') {
        context.responseData.status = 409;
        return;
    }
    context.responseData.status = 500;
}

function resolveUserId(context: HttpContext): bigint | null {
    if (!context.auth.check()) {
        context.responseData.status = 401;
        return null;
    }

    const userId = context.auth.getUserId();
    if (userId === null) {
        context.responseData.status = 401;
        return null;
    }

    return BigInt(userId);
}

export default {
    async getSubscriptions(context: HttpContext): Promise<GetSubscriptionsResponse> {
        context.logger.info('getSubscriptions handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const result = await pushSubscriptionService.getSubscriptions(userId);
        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', subscriptions: result.data.subscriptions as any };
    },

    async createSubscription(
        context: HttpContext<CreateSubscriptionInput>,
    ): Promise<CreateSubscriptionResponse> {
        context.logger.info('createSubscription handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const payload = getTypedPayload(context);
        const result = await pushSubscriptionService.createSubscription(userId, payload);

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', subscription: result.data.subscription as any };
    },

    async getSubscription(context: HttpContext): Promise<GetSubscriptionResponse> {
        context.logger.info('getSubscription handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const result = await pushSubscriptionService.getSubscription(
            userId,
            BigInt(subscriptionId),
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.data as any };
    },

    async updateSubscription(
        context: HttpContext<UpdateSubscriptionInput>,
    ): Promise<UpdateSubscriptionResponse> {
        context.logger.info('updateSubscription handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const payload = getTypedPayload(context);

        const result = await pushSubscriptionService.updateSubscription(
            userId,
            BigInt(subscriptionId),
            payload,
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', subscription: result.data.subscription as any };
    },

    async deleteSubscription(context: HttpContext): Promise<DeleteSubscriptionResponse> {
        context.logger.info('deleteSubscription handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const result = await pushSubscriptionService.deleteSubscription(
            userId,
            BigInt(subscriptionId),
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', message: result.data.message };
    },

    async getSubscriptionLogs(context: HttpContext): Promise<GetSubscriptionLogsResponse> {
        context.logger.info('getSubscriptionLogs handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const result = await pushSubscriptionService.getSubscriptionLogs(
            userId,
            BigInt(subscriptionId),
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.data };
    },

    async getSubscriptionStatistics(
        context: HttpContext,
    ): Promise<GetSubscriptionStatisticsResponse> {
        context.logger.info('getSubscriptionStatistics handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const result = await pushSubscriptionService.getSubscriptionStatistics(
            userId,
            BigInt(subscriptionId),
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.data as any };
    },

    async deactivateSubscription(
        context: HttpContext,
    ): Promise<DeactivateSubscriptionResponse> {
        context.logger.info('deactivateSubscription handler');

        const userId = resolveUserId(context);
        if (userId === null) {
            return { status: 'error', message: 'Unauthorized' };
        }

        const { subscriptionId } = context.httpData.params as { subscriptionId: string };
        const result = await pushSubscriptionService.deactivateSubscription(
            userId,
            BigInt(subscriptionId),
        );

        if (!result.ok) {
            setServiceErrorStatus(context, result.code);
            return { status: 'error', message: result.message };
        }

        return { status: 'success', data: result.data.data as any };
    },
};
