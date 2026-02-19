import { type } from "@arktype/type";

export const PingResponseSchema = type({
  status: "string",
});
export type PingResponse = typeof PingResponseSchema.infer;

export const TestRouteResponseSchema = type({
  status: "string",
});
export type TestRouteResponse = typeof TestRouteResponseSchema.infer;

export const InitResponseSchema = type({
  status: "'ok' | 'error' | 'unauthorized'",
  "message?": "string",
  "user?": {
    id: "number",
    name: "string",
    email: "string",
    createdAt: "string",
    updatedAt: "string",
  },
  "wsUrl?": "string",
  "storage?": {
    "s3Endpoint?": "string",
    "s3Bucket?": "string",
    "s3Prefix?": "string",
    "s3StaticDataPrefix?": "string",
    "s3DynamicDataPrefix?": "string",
  },
});
export type InitResponse = typeof InitResponseSchema.infer;

export const TestHeadersResponseSchema = type({
  status: "string",
  headers: "unknown[]",
  params: "unknown[]",
});
export type TestHeadersResponse = typeof TestHeadersResponseSchema.infer;

export const GetSetCookiesResponseSchema = type({
  status: "string",
  cookies: "unknown[]",
});
export type GetSetCookiesResponse = typeof GetSetCookiesResponseSchema.infer;

export const TestSessionResponseSchema = type({
  status: "string",
  cookies: "unknown[]",
  sessionInfo: "unknown",
});
export type TestSessionResponse = typeof TestSessionResponseSchema.infer;

export const SaveUserResponseSchema = type({
  status: "string",
  user: {
    id: "number",
    name: "string",
    email: "string",
  },
});
export type SaveUserResponse = typeof SaveUserResponseSchema.infer;

export const TestApiSessionResponseSchema = type({
  status: "string",
  headers: "unknown[]",
  sessionInfo: "unknown",
});
export type TestApiSessionResponse = typeof TestApiSessionResponseSchema.infer;

export const IndexResponseSchema = type({
  payload: "unknown",
  responseData: "unknown",
});
export type IndexResponse = typeof IndexResponseSchema.infer;

export const TestParamsResponseSchema = type({
  params: "unknown",
  query: "string[]",
  status: "string",
});
export type TestParamsResponse = typeof TestParamsResponseSchema.infer;

export const SetHeaderAndCookieResponseSchema = type({
  status: "string",
});
export type SetHeaderAndCookieResponse =
  typeof SetHeaderAndCookieResponseSchema.infer;

export const TestMiddlewareResponseSchema = type({
  middlewares: "string[]",
  status: "string",
});
export type TestMiddlewareResponse = typeof TestMiddlewareResponseSchema.infer;

export const UpdateWsTokenResponseSchema = type({
  status: "string",
  "message?": "string",
  "wsUrl?": "string",
});
export type UpdateWsTokenResponse = typeof UpdateWsTokenResponseSchema.infer;
