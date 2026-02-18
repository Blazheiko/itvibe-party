import { type } from "@arktype/type";

export const RegisterResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "user?": {
    id: "number",
    name: "string",
    email: "string",
  },
  "wsUrl?": "string",
});
export type RegisterResponse = typeof RegisterResponseSchema.infer;

export const LoginResponseSchema = type({
  status: "'success' | 'error' | 'unauthorized'",
  "message?": "string",
  "user?": {
    id: "number",
    name: "string",
    email: "string",
  },
  "wsUrl?": "string",
});
export type LoginResponse = typeof LoginResponseSchema.infer;

export const LogoutResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
});
export type LogoutResponse = typeof LogoutResponseSchema.infer;

export const LogoutAllResponseSchema = type({
  status: "'success' | 'error'",
  "message?": "string",
  "deletedCount?": "number",
});
export type LogoutAllResponse = typeof LogoutAllResponseSchema.infer;
