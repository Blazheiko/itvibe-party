import { type } from "@arktype/type";

export const PushSubscriptionSchema = type({
  id: "bigint",
  userId: "bigint",
  endpoint: "string",
  p256dhKey: "string",
  authKey: "string",
  userAgent: "string | null",
  ipAddress: "string | null",
  deviceType: "string | null",
  browserName: "string | null",
  browserVersion: "string | null",
  osName: "string | null",
  osVersion: "string | null",
  notificationTypes: "unknown",
  timezone: "string | null",
  isActive: "boolean",
  lastUsedAt: "Date | null",
  createdAt: "Date",
  updatedAt: "Date",
  "notificationLogs?": "unknown[]",
});
export type PushSubscription = typeof PushSubscriptionSchema.infer;

export const PushSubscriptionLogSchema = type({
  id: "bigint",
  "subscriptionId?": "bigint | null",
  "userId?": "bigint | null",
  status: "string | null",
  "errorMessage?": "string | null",
  "messageTitle?": "string | null",
  "messageBody?": "string | null",
  "messageData?": "unknown",
  "responseData?": "unknown",
  sentAt: "Date",
});
export type PushSubscriptionLog = typeof PushSubscriptionLogSchema.infer;

export const PushSubscriptionLogSummarySchema = type({
  id: "bigint",
  messageTitle: "string | null",
  status: "string | null",
  sentAt: "Date",
});
export type PushSubscriptionLogSummary =
  typeof PushSubscriptionLogSummarySchema.infer;

export const GetSubscriptionsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "subscriptions?": "unknown[]",
});
export type GetSubscriptionsResponse = typeof GetSubscriptionsResponseSchema.infer;

export const CreateSubscriptionResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "subscription?": "unknown",
});
export type CreateSubscriptionResponse =
  typeof CreateSubscriptionResponseSchema.infer;

export const GetSubscriptionResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown | null",
});
export type GetSubscriptionResponse = typeof GetSubscriptionResponseSchema.infer;

export const UpdateSubscriptionResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "subscription?": "unknown | null",
});
export type UpdateSubscriptionResponse =
  typeof UpdateSubscriptionResponseSchema.infer;

export const DeleteSubscriptionResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
});
export type DeleteSubscriptionResponse =
  typeof DeleteSubscriptionResponseSchema.infer;

export const GetSubscriptionLogsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown[]",
});
export type GetSubscriptionLogsResponse =
  typeof GetSubscriptionLogsResponseSchema.infer;

export const GetSubscriptionStatisticsResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": {
    subscription: "unknown",
    statistics: "unknown",
  },
});
export type GetSubscriptionStatisticsResponse =
  typeof GetSubscriptionStatisticsResponseSchema.infer;

export const DeactivateSubscriptionResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "data?": "unknown | null",
});
export type DeactivateSubscriptionResponse =
  typeof DeactivateSubscriptionResponseSchema.infer;
