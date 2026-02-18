import { type } from "@arktype/type";

const RegisterStatus = type.enumerated("success", "error");
export const RegisterResponseSchema = type({
  status: RegisterStatus,
  "message?": "string",
  "user?": {
    id: "number",
    name: "string",
    email: "string",
  },
  "wsUrl?": "string",
});

export type RegisterResponse = typeof RegisterResponseSchema.infer;

const LoginStatus = type.enumerated("success", "error", "unauthorized");
export const LoginResponseSchema = type({
  status: LoginStatus,
  "message?": "string",
  "user?": {
    id: "number",
    name: "string",
    email: "string",
  },
  "wsUrl?": "string",
});

export type LoginResponse = typeof LoginResponseSchema.infer;

const LogoutStatus = type.enumerated("success", "error");
export const LogoutResponseSchema = type({
  status: LogoutStatus,
  "message?": "string",
});

export type LogoutResponse = typeof LogoutResponseSchema.infer;

const LogoutAllStatus = type.enumerated("success", "error");
export const LogoutAllResponseSchema = type({
  status: LogoutAllStatus,
  "message?": "string",
  "deletedCount?": "number",
});

export type LogoutAllResponse = typeof LogoutAllResponseSchema.infer;
