// @ts-nocheck
import { getWsRoute } from "#vendor/start/router.js";
import executeMiddlewares from "#vendor/utils/middlewares/core/execute-httpMiddlewares.js";
// import validators from '#vendor/start/validators.js';
import type {
  Session,
  WsData,
  WsResponseData,
  MyWebSocket,
  UserConnection,
  // ValidatorFunction,
  HttpContext,
  Payload,
} from "#vendor/types/types.js";
import createWsContext from "../context/ws-context.js";
import checkRateLimitWs, {
  createWsRateLimitErrorResponse,
} from "../rate-limit/ws-rate-limit.js";
import type { WsMessage } from "#vendor/utils/validators/shemas/ws-shema.js";
import { type } from "@arktype/type";
import { ValidationError } from "#app/validate/errors/validation-error.js";
// import logger from '#logger';

// const wsRoutes: WsRoutes = getWsRoutes();

export default async (
  message: WsMessage,
  ws: MyWebSocket,
  userData: UserConnection,
  session: Session,
): Promise<WsResponseData | null> => {
  const responseData: WsResponseData = {
    data: {},
    event: message.event,
    timestamp: message.timestamp,
    status: "200",
    error: null,
  };
  try {
    const event = message.event;
    const nameRoute = event.split(":")[0];
    if (nameRoute === undefined) {
      throw new Error("Invalid event");
    }
    const route = getWsRoute(nameRoute);
    if (route !== undefined) {
      // Check rate limit before processing
      const rateLimitResult = await checkRateLimitWs(
        ws,
        route,
        route.groupRateLimit,
      );

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded - return error response
        return createWsRateLimitErrorResponse(
          rateLimitResult.errorMessage ?? "Rate limit exceeded",
          rateLimitResult.retryAfter ?? 60,
          message.event,
        );
      }

      let payload: Payload | null = message.payload ?? null;
      if (route.validator !== undefined) {
        const validatedInput = route.validator(message.payload) as Payload;

        if (validatedInput instanceof type.errors) {
          throw new ValidationError([validatedInput.summary]);
        }

        payload = validatedInput;
      }
      const wsData: WsData = {
        middlewareData: { userData },
        status: "200",
        payload:
          payload !== null &&
          typeof payload === "object" &&
          !Buffer.isBuffer(payload)
            ? Object.freeze({ ...payload })
            : (payload ?? {}),
      };

      // const context = { wsData, responseData , session : null , auth: null};
      const context = createWsContext(wsData, responseData, session);
      if (
        route.middlewares === undefined ||
        !Array.isArray(route.middlewares) ||
        route.middlewares.length === 0 ||
        (await executeMiddlewares(
          route.middlewares,
          context as unknown as HttpContext,
        ))
      ) {
        const handler = route.handler;
        responseData.data = await handler(context);
      }

      return responseData;
    }
    responseData.status = "404";
    responseData.error = {
      code: 404,
      message: "Route not found",
    };
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      responseData.status = "422";
      responseData.error = {
        code: 422,
        message: "Validation failure",
        messages: e.messages,
      };
    } else {
      responseData.status = "500";
    }
  }

  return responseData;
};
