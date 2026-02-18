import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import { authService } from "#app/services/auth-service.js";
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  LogoutAllResponse,
} from "shared";
import type { LoginInput, RegisterInput } from "shared/schemas";

function setServiceErrorStatus(
  context: HttpContext,
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "INTERNAL",
): void {
  if (code === "BAD_REQUEST") {
    context.responseData.status = 400;
    return;
  }
  if (code === "UNAUTHORIZED") {
    context.responseData.status = 401;
    return;
  }
  if (code === "NOT_FOUND") {
    context.responseData.status = 404;
    return;
  }
  if (code === "CONFLICT") {
    context.responseData.status = 409;
    return;
  }
  context.responseData.status = 500;
}

export default {
  async register(
    context: HttpContext<RegisterInput>,
  ): Promise<RegisterResponse> {
    context.logger.info("register handler");

    const payload = getTypedPayload(context);
    const result = await authService.register(
      payload,
      context.auth,
      context.session,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      return { status: "error", message: result.message };
    }

    return {
      status: result.data.status,
      user: result.data.user,
      wsUrl: result.data.wsUrl,
    };
  },

  async login(context: HttpContext<LoginInput>): Promise<LoginResponse> {
    context.logger.info("login handler");

    const payload = getTypedPayload(context);
    const result = await authService.login(
      payload,
      context.auth,
      context.session,
    );

    if (!result.ok) {
      setServiceErrorStatus(context, result.code);
      if (result.code === "UNAUTHORIZED") {
        return { status: "unauthorized", message: result.message };
      }
      return { status: "error", message: result.message };
    }

    return {
      status: result.data.status,
      user: result.data.user,
      wsUrl: result.data.wsUrl,
    };
  },

  async logout(context: HttpContext): Promise<LogoutResponse> {
    context.logger.info("logout handler");
    const result = await authService.logout(context.auth);
    return { status: result.data.status };
  },

  async logoutAll(context: HttpContext): Promise<LogoutAllResponse> {
    context.logger.info("logoutAll handler");
    const result = await authService.logoutAll(context.auth);
    return {
      status: result.data.status,
      deletedCount: result.data.deletedCount,
    };
  },
};
