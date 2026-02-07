import baseApi from './base-api'

interface ApiResponse<T> {
  data: T | null
  error: { message: string; code: number } | null
}

// Interfaces for Push Subscriptions
interface PushSubscriptionData extends Record<string, unknown> {
    endpoint: string
    p256dhKey: string
    authKey: string
    userAgent?: string
    ipAddress?: string
    deviceType?: string
    browserName?: string
    browserVersion?: string
    osName?: string
    osVersion?: string
    notificationTypes?: string[]
    timezone?: string
}

interface PushSubscriptionResponse {
    id: number
    user_id: number
    endpoint: string
    p256dh_key: string
    auth_key: string
    user_agent?: string
    device_type?: string
    browser_name?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface PushSubscriptionStatistics {
    total_sent: number
    total_delivered: number
    last_sent_at?: string
    subscription_duration: number
}

interface UpdateMessageResponse {
    status: string
    message?: {
        id: number
        sender_id: number
        receiver_id: number
        type: string
        content: string
        src: string
        is_read: boolean
        created_at: string
        updated_at: string
    }
}

export const messagesApi = {
    deleteMessage: async (messageId: number): Promise<ApiResponse<{ success: boolean }>> => {
        return baseApi.http<{ success: boolean }>('DELETE', `/api/chat/messages/${messageId}`)
    },

    // Edit message
    updateMessage: async (
        messageId: number,
        content: string,
        userId: number,
    ): Promise<ApiResponse<UpdateMessageResponse>> => {
        return baseApi.http<UpdateMessageResponse>('PUT', `/api/chat/messages/${messageId}`, {
            userId,
            messageId,
            content,
        })
    },
}

// API functions for Push Subscriptions
export const pushSubscriptionApi = {
    // Get all user subscriptions
    getSubscriptions: async (): Promise<ApiResponse<PushSubscriptionResponse[]>> => {
        return baseApi.http<PushSubscriptionResponse[]>('GET', '/api/push-subscriptions')
    },

    // Create a new subscription
    createSubscription: async (
        subscriptionData: PushSubscriptionData,
    ): Promise<ApiResponse<PushSubscriptionResponse>> => {
        return baseApi.http<PushSubscriptionResponse>(
            'POST',
            '/api/push-subscriptions',
            subscriptionData,
        )
    },

    // Get a specific subscription
    getSubscription: async (
        subscriptionId: number,
    ): Promise<ApiResponse<PushSubscriptionResponse>> => {
        return baseApi.http<PushSubscriptionResponse>(
            'GET',
            `/api/push-subscriptions/${subscriptionId}`,
        )
    },

    // Delete a subscription
    deleteSubscription: async (
        subscriptionId: number,
    ): Promise<ApiResponse<{ success: boolean }>> => {
        return baseApi.http<{ success: boolean }>(
            'DELETE',
            `/api/push-subscriptions/${subscriptionId}`,
        )
    },

    // Delete a subscription by endpoint
    deleteSubscriptionByEndpoint: async (
        endpoint: string,
    ): Promise<ApiResponse<{ success: boolean }>> => {
        return baseApi.http<{ success: boolean }>('DELETE', '/api/push-subscriptions', { endpoint })
    },

    // Get subscription statistics
    getSubscriptionStatistics: async (
        subscriptionId: number,
    ): Promise<ApiResponse<PushSubscriptionStatistics>> => {
        return baseApi.http<PushSubscriptionStatistics>(
            'GET',
            `/api/push-subscriptions/${subscriptionId}/statistics`,
        )
    },

    // Deactivate a subscription
    deactivateSubscription: async (
        subscriptionId: number,
    ): Promise<ApiResponse<PushSubscriptionResponse>> => {
        return baseApi.http<PushSubscriptionResponse>(
            'PUT',
            `/api/push-subscriptions/${subscriptionId}/deactivate`,
        )
    },

    // Send a subscription status notification
    sendSubscriptionNotification: async (
        notificationData: Record<string, unknown>,
    ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
        return baseApi.http<{ success: boolean; message: string }>(
            'POST',
            '/api/notifications/subscription-status',
            notificationData,
        )
    },

    // Send a system notification to admins
    sendSystemNotification: async (
        message: string,
        type: string = 'info',
        metadata?: Record<string, unknown>,
    ): Promise<ApiResponse<{ success: boolean }>> => {
        return baseApi.http<{ success: boolean }>('POST', '/api/notifications/system', {
            message,
            type,
            metadata,
        })
    },

    // Get VAPID public key from the server
    getVapidPublicKey: async (): Promise<ApiResponse<{ vapidPublicKey: string }>> => {
        return baseApi.http<{ vapidPublicKey: string }>(
            'GET',
            '/api/push-subscriptions/vapid-public-key',
        )
    },
}

// // Create an API instance
// const api = createApi('http://127.0.0.1:8088', new WebsocketBase('ws://127.0.0.1:8088'))

// export default baseApi
