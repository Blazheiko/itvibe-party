import * as uWS from "uWebSockets.js";
import type {
  HttpRequest,
  HttpResponse,
  us_listen_socket,
  WebSocket,
  TemplatedApp,
} from "uWebSockets.js";
import appConfig from "#config/app.js";
import corsConfig from "#config/cors.js";
import cookiesConfig from "#config/cookies.js";
import state from "#app/state/state.js";
import {
  onMessage,
  onOpen,
  onClose,
  handleUpgrade,
  closeAllWs,
} from "#vendor/utils/network/ws-handlers.js";
import {
  getHeaders,
  getData,
  extractParameters,
  normalizePath,
  parseCookies,
} from "../utils/network/http-request-handlers.js";
import { ParameterValidationError } from "#app/validate/checkers/parameter-checker.js";
import { ValidationError } from "#app/validate/errors/validation-error.js";
import logger from "#vendor/utils/logger.js";
import { getListRoutes } from "#vendor/start/router.js";
import {
  setHeaders,
  setCookies,
} from "#vendor/utils/network/http-response-handlers.js";
import executeMiddlewares from "#vendor/utils/middlewares/core/execute-httpMiddlewares.js";
import checkRateLimit from "#vendor/utils/rate-limit/http-rate-limit.js";
import type {
  Cookie,
  Header,
  HttpData,
  MyWebSocket,
  ResponseData,
  RouteItem,
  Payload,
  CookieOptions,
  UploadedFile,
} from "#vendor/types/types.js";
import contextHandler from "../utils/context/http-context.js";
import {
  cacheStaticSource,
  staticHandler,
  staticCacheHandler,
} from "#vendor/start/static-server.js";
import configApp from "#config/app.js";
import httpRoutes from "#app/routes/http-routes.js";
import wsRoutes from "#app/routes/ws-routes.js";
// import schemas from "#app/validate/schemas/schemas.js";
import getIP from "#vendor/utils/network/get-ip.js";
import { getApiTypesForDocumentation } from "#vendor/utils/tooling/parse-types-from-dts.js";
import { serializeRoutes } from "#vendor/utils/routing/serialize-routes.js";
import path from "path";
import { readFile } from "node:fs/promises";
import { MIME_TYPES } from "#vendor/constants/mime-types.js";
import {
  makeBroadcastJson,
  makeJson,
} from "#vendor/utils/helpers/json-handlers.js";
import { type } from "@arktype/type";
import * as console from "node:console";

export type {
  HttpRequest,
  HttpResponse,
  us_socket_context_t,
  us_listen_socket,
  WebSocket,
  TemplatedApp,
  CompressOptions,
} from "uWebSockets.js";

export type UserData = Record<string, unknown>;
const server: TemplatedApp = uWS.App() as TemplatedApp;

const broadcastMessage = (
  userId: number,
  event: string,
  payload: Payload,
): void => {
  // logger.info(`broadcastMessage: ${userId} ${event}`);
  if (state['listenSocket'] !== undefined)
    server.publish(
      `user:${String(userId)}`,
      JSON.stringify(
        { event: `broadcast:${event}`, status: 200, payload },
        (_, v: unknown) => (typeof v === "bigint" ? v.toString() : v),
      ),
    );
};

const broadcastToChannel = (
  channel: string,
  event: string,
  payload: Payload,
): void => {
  server.publish(channel, makeBroadcastJson(event, 200, payload));
};

// const broadcastOnline = (userId: string, status: string) => {
//     server.publish(
//         `change_online`,
//         JSON.stringify({
//             event: `broadcast:change_online`,
//             status: 200,
//             payload: { userId, status },
//         },
//         (_, v) => (typeof v === 'bigint' ? v.toString() : v),
//     ));
// };

const configureWebsockets = (server: TemplatedApp): TemplatedApp => {
  return server.ws(`/${appConfig.pathPrefix}/websocket/:token`, {
    compression: 0,
    idleTimeout: 120, // According to protocol
    maxPayloadLength: 1 * 1024 * 1024,
    maxBackpressure: 64 * 1024,
    open: (ws: WebSocket<Record<string, unknown>>): void => {
      onOpen(ws as MyWebSocket);
    },
    message: (
      ws: WebSocket<Record<string, unknown>>,
      message: ArrayBuffer,
      isBinary: boolean,
    ) => onMessage(ws as MyWebSocket, message, isBinary),
    // upgrade: async (res: HttpResponse, req: HttpRequest, context: us_socket_context_t) => {
    //    await handleUpgrade(res, req, context);
    // },
    upgrade: handleUpgrade,
    // drain: (ws) => handleDrain(ws),
    close: (
      ws: WebSocket<Record<string, unknown>>,
      code: number,
      message: ArrayBuffer,
    ): void => {
      onClose(ws as MyWebSocket, code, message).catch((error: unknown) => {
        console.error(error);
      });
    },
  });
};

type DeleteCookie = (name: string) => void;
type SetHeader = (name: string, value: string) => void;
// CSP header is applied from staticServer for HTML responses
const getResponseData = (): ResponseData => {
  const cookies: Map<string, Cookie> = new Map<string, Cookie>();
  const headers: Header[] = [];
  const setCookie: ResponseData["setCookie"] = (
    nameOrCookie: string | Cookie,
    value?: string,
    options?: CookieOptions,
  ): void => {
    if (typeof nameOrCookie === "string") {
      cookies.set(nameOrCookie, {
        name: nameOrCookie,
        value: value ?? "",
        path: options?.path ?? cookiesConfig.default.path,
        httpOnly: options?.httpOnly ?? cookiesConfig.default.httpOnly,
        secure: options?.secure ?? cookiesConfig.default.secure,
        expires: options?.expires ?? undefined,
        maxAge: options?.maxAge ?? cookiesConfig.default.maxAge,
        sameSite: options?.sameSite ?? cookiesConfig.default.sameSite,
      });
      return;
    }

    cookies.set(nameOrCookie.name, nameOrCookie);
  };

  const deleteCookie: DeleteCookie = (name: string): void => {
    cookies.delete(name);
  };
  const setHeader: SetHeader = (name: string, value: string): void => {
    headers.push({ name, value });
  };

  return {
    aborted: false,
    payload: {},
    middlewareData: {},
    headers,
    cookies,
    status: 200,
    setCookie,
    deleteCookie,
    setHeader,
  };
};

const getHttpData = async (
  req: HttpRequest,
  res: HttpResponse,
  route: RouteItem,
): Promise<HttpData> => {
  const cookies: Map<string, string> = parseCookies(req.getHeader("cookie"));
  //   const url = req.getUrl();
  const query = new URLSearchParams(req.getQuery());
  const headers = getHeaders(req);
  let params: Record<string, string>;
  if (route.parametersKey !== undefined && route.parametersKey.length > 0) {
    params = extractParameters(route.parametersKey, req);
  } else {
    params = {};
  }
  const contentType = headers.get("content-type");
  // const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
  const ip = getIP(req, res);
  const isPayload =
    (route.method === "post" || route.method === "put") &&
    contentType?.trim().toLowerCase() === "application/json";

  let payload: Payload | null = null;
  let files: Map<string, UploadedFile> | null = null;
  // logger.info({validator: route.validator}, "getHttpData")

  const hasBody = route.method === "post" || route.method === "put";

  if (hasBody && contentType !== undefined) {
    const result = await getData(res, contentType, headers);
    payload = result.payload;

    if (isPayload && route.validator !== undefined && result.payload !== null) {
      logger.info('route.validator Get Http Data')
      const validate = route.validator as unknown as (payload: Payload) => unknown;
      const validatedInput = validate(result.payload);

      if (validatedInput instanceof type.errors) {
        throw new ValidationError([(validatedInput as type.errors).summary]);
      }

      payload = validatedInput as Payload;
    }

    files = result.files;
  }

  return {
    ip,
    params,
    payload,
    query,
    headers,
    contentType,
    cookies,
    isJson: isPayload,
    validator: route.validator,
    files,
    hasFile: (name: string): boolean => files !== null && files.has(name),
  };
};

const sendResponse = (res: HttpResponse, responseData: ResponseData): void => {
  res.writeStatus(String(responseData.status));
  // if (httpData.isJson) res.writeHeader('content-type', 'application/json');
  res.writeHeader("content-type", "application/json");
  if (responseData.headers.length > 0) setHeaders(res, responseData.headers);
  if (responseData.cookies.size > 0) setCookies(res, responseData.cookies);
  if (corsConfig.enabled) setCorsHeader(res);
  // && responseData.status >= 200 && responseData.status < 300
  if (responseData.payload !== null) {
    // const transformedData = transformBigInts(responseData.payload);
    // res.end(JSON.stringify(transformedData));
    res.end(makeJson(responseData.payload));
  } else res.end(String(responseData.status));
};

// interface State {
//   listenSocket: us_listen_socket | null;
// }

const handleError = (res: HttpResponse, error: unknown): void => {
  logger.error({ err: error }, "Handle Error");

  if (error instanceof ValidationError) {
    res.writeStatus("422");
    res.end(
      JSON.stringify({
        message: "Validation failure",
        messages: error.messages,
      }),
    );
  } else if (error instanceof ParameterValidationError) {
    // Handle parameter validation errors with 400 Bad Request
    res.writeStatus("400");
    res.end(
      JSON.stringify({
        message: "Invalid parameter",
        parameter: error.parameterName,
        value: error.parameterValue,
        error: error.message,
      }),
    );
  } else {
    const errorMessage =
      configApp.env === "prod" || configApp.env === "production"
        ? "Internal server error"
        : String(error);
    res.writeStatus("500");
    res.end(makeJson(errorMessage));
  }
};

// Always point to source types directory, not dist
const projectRoot = process.cwd();
const typesDirectory = path.join(projectRoot, "app/controllers/types");

// Parse types from .d.ts files
let types: Record<string, unknown> = {};
// let mapping: Record<string, string> = {};
if (configApp.docPage) {
  ({ types } = getApiTypesForDocumentation(typesDirectory));
}

const docRoutesHandler = async (
  res: HttpResponse,
  _: HttpRequest,
): Promise<void> => {
  return new Promise((resolve: () => void) => {
    if (
      state['listenSocket'] !== undefined &&
      configApp.docPage &&
      configApp.serveStatic
    ) {
      try {
        // Convert schemas to readable format
        const validationSchemas: Record<string, unknown> = {};

        // for (const key of Object.keys(schemas)) {
        //   validationSchemas[key] = schemas[key]?.doc ?? {};
        // }

        // Serialize routes with handler names instead of function references

        const serializedHttpRoutes = serializeRoutes(httpRoutes);
        const serializedWsRoutes = serializeRoutes(wsRoutes);

        res.cork(() => {
          res.writeStatus(`200`);
          res.writeHeader("content-type", "application/json");
          res.end(
            makeJson({
              httpRoutes: serializedHttpRoutes,
              wsRoutes: serializedWsRoutes,
              validationSchemas,
              responseTypes: types,
              pathPrefix: appConfig.pathPrefix,
            }),
          );
        });
      } catch (err: unknown) {
        console.error(err);
        //   logger.error({ err }, "docRoutesHandler error");
        res.cork(() => {
          handleError(res, err);
        });
      }
    } else {
      // logger.warn("We just refuse if already shutting down");
      res.cork(() => {
        res.writeStatus("404").end(makeJson({ message: "Not found" }));
      });
    }
    resolve();
  });
  //   logger.info("docRoutesHandler");

  //   await new Promise(resolve => setTimeout(resolve, 1));
};

const setHttpHandler = async (
  res: HttpResponse,
  req: HttpRequest,
  route: RouteItem,
): Promise<void> => {
  // logger.info('Handler method:' + route.method + ' url:' + route.url);
  if (state['listenSocket'] !== undefined) {
    try {
      let aborted = false as boolean;
      res.onAborted(() => {
        aborted = true;
      });
      const httpData = await getHttpData(req, res, route);
      const responseData = getResponseData();
      const context = contextHandler(httpData, responseData, route.validator);

      // Check rate limit before executing middleware
      const rateLimitPassed = await checkRateLimit(
        httpData,
        responseData,
        route,
        route.groupRateLimit,
      );

      if (
        rateLimitPassed &&
        (route.middlewares?.length === 0 ||
          (await executeMiddlewares(route.middlewares, context))) &&
        responseData.status >= 200 &&
        responseData.status < 300
      )
        responseData.payload = (await route.handler(context)) as Payload;

      if (aborted) return;

      res.cork(() => {
        sendResponse(res, responseData);
      });
    } catch (err: unknown) {
      logger.error({ err }, "Set Http Handler Error");
      res.cork(() => {
        handleError(res, err);
      });
    }
  } else {
    logger.warn("We just refuse if already shutting down");
    res.close();
  }
};

const configureHttp = async (server: TemplatedApp): Promise<void> => {
  //   logger.info("configureHttp get");
  // console.log(getGetRoutes());
  if (appConfig.serveStatic) {
    const staticCache = await cacheStaticSource();
    if (staticCache !== null) {
      staticCache.forEach((value, key) => {
        server.get(key, async (res, req) => {
          await staticCacheHandler(res, req, value);
        });
      });
    }
    // staticRoutes.forEach((route) => {
    //     server.get(route, (res, req) => {
    //         staticIndexHandler(res, req);
    //     });
    // });
  }
  // Serve uploaded files from storage/app
  server.get(
    `/${appConfig.pathPrefix}/storage/:filename`,
    async (res: HttpResponse, req: HttpRequest) => {
      let aborted = false;
      res.onAborted(() => {
        aborted = true;
      });

      const filename = req.getParameter(0) ?? "";

      if (
        filename === "" ||
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        if (!aborted)
          res.cork(() => {
            res.writeStatus("400").end("Bad request");
          });
        return;
      }

      try {
        const filePath = path.join(process.cwd(), "storage", "app", filename);
        const data = await readFile(filePath);
        if (aborted) return;

        const ext = path.extname(filename).substring(1).toLowerCase();
        const contentType =
          MIME_TYPES[ext] ??
          MIME_TYPES["default"] ??
          "application/octet-stream";

        res.cork(() => {
          if (corsConfig.enabled) setCorsHeader(res);
          res.writeStatus("200");
          res.writeHeader("content-type", contentType);
          res.writeHeader(
            "cache-control",
            "public, max-age=31536000, immutable",
          );
          res.end(data);
        });
      } catch {
        if (!aborted)
          res.cork(() => {
            res.writeStatus("404").end("File not found");
          });
      }
    },
  );

  getListRoutes().forEach((route: RouteItem) => {
    if (route.method !== "ws" && route.method !== "delete") {
      server[route.method](
        `/${normalizePath(route.url)}`,
        async (res: HttpResponse, req: HttpRequest) => {
          await setHttpHandler(res, req, route);
        },
      );
    }
  });
  if (configApp.docPage && configApp.serveStatic) {
    server.get(`/${appConfig.pathPrefix}/doc/routes`, async (res, req) => {
      await docRoutesHandler(res, req);
    });
  }

  server.any("/*", (res: HttpResponse, req: HttpRequest): void => {
    const url = req.getUrl();
    const method = req.getMethod();
    if (corsConfig.enabled && method === "options") {
      //'OPTIONS' method === 'OPTIONS'
      res.cork(() => {
        if (corsConfig.enabled) setCorsHeader(res);
        res.writeStatus("200").end();
      });
    } else if (
      url.startsWith(`/${appConfig.pathPrefix}/`) &&
      method !== "options"
    ) {
      res.cork(() => {
        const data = "404 Not Found";
        const statusCode = "404";
        res.writeStatus(statusCode);
        res.end(data);
      });
    } else if (appConfig.serveStatic && method === "get") {
      staticHandler(res, req);
    } else {
      res.cork(() => {
        res.writeStatus("404").end(makeJson({ message: "Not found" }));
      });
    }
  });
};

const setCorsHeader = (res: HttpResponse): void => {
  res.writeHeader("Access-Control-Allow-Origin", corsConfig.origin);
  res.writeHeader("Access-Control-Allow-Methods", corsConfig.methods);
  res.writeHeader("Access-Control-Max-Age", String(corsConfig.maxAge));
  res.writeHeader("Access-Control-Expose-Headers", corsConfig.exposeHeaders);
  res.writeHeader("Access-Control-Allow-Headers", corsConfig.allowHeaders);
  if (corsConfig.credentials) {
    res.writeHeader("Access-Control-Allow-Credentials", "true");
  }
  //   if (corsConfig.headers !== undefined) {
  //     //TODO
  //     // const reqHeaders = req.getHeader('access-control-request-headers');
  //     // res.writeHeader('Access-Control-Allow-Headers', reqHeaders);
  //   }
};
// let server = null;
const initServer = async (): Promise<void> => {
  configureWebsockets(server);
  await configureHttp(server);
  if (appConfig.unixPath !== undefined) {
    server.listen_unix((token: us_listen_socket | false) => {
      if (token !== false) {
        logger.info(`Listening unix socket: ${appConfig.unixPath ?? ""}`);
        state['listenSocket'] = token;
      } else {
        logger.error(
          `Failed to listening unix socket: ${appConfig.unixPath ?? ""}`,
        );
      }
    }, appConfig.unixPath);
  } else {
    server.listen(
      appConfig.host,
      appConfig.port,
      (token: us_listen_socket | false) => {
        if (token !== false) {
          logger.info(
            `Listening http://${appConfig.host}:${String(appConfig.port)}`,
          );
          state['listenSocket'] = token;
        } else {
          logger.error(`Failed to listen to port ${String(appConfig.port)}`);
        }
      },
    );
  }
};

const stopServer = (type = "handle"): void => {
  logger.info(`server stop type: ${type}`);
  closeAllWs()
    .then(() => {
      if (state['listenSocket'] !== undefined)
        uWS.us_listen_socket_close(state['listenSocket']);
      state['listenSocket'] = undefined;
    })
    .catch((error: unknown) => {
      console.error(error);
    });
};

export {
  initServer,
  stopServer,
  broadcastMessage,
  broadcastToChannel,
  getHttpData,
};
