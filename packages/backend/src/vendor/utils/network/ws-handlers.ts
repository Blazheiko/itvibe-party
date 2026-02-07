import logger from "#vendor/utils/logger.js";
import wsApiHandler from "../routing/ws-api-dispatcher.js";
import { generateUUID } from "metautil";
import redisInstance from "#database/redis.js";
// import type { Redis } from "ioredis";
import type {
  HttpRequest,
  HttpResponse,
  us_socket_context_t,
  UserData,
} from "#vendor/start/server.js";

import type {
  MyWebSocket,
  UserConnection,
  SessionInfo,
  WsResponseData,
  SessionData,
} from "#vendor/types/types.js";
// import { broadcastOnline } from '#vendor/start/server.js';
import { wsSessionHandler } from "../session/session-handler.js";
import getIP from "./get-ip.js";
import { wsEventEmitter } from "#vendor/utils/events/ws-event-manager.js";
import { makeJson } from "#vendor/utils/helpers/json-handlers.js";
import configApp from "#config/app.js";
import { WsMessageSchema } from "../validators/shemas/ws-shema.js";
import type { WsMessage } from "../validators/shemas/ws-shema.js";
import { type } from "@arktype/type";

const redis = redisInstance;

const wsStorage: Set<MyWebSocket> = new Set<MyWebSocket>();
interface userConnections {
  ip: string;
  userAgent: string;
  connections: Map<string, MyWebSocket>;
  [key: string]: unknown;
}
type userStorage = Map<string, userConnections>;
const userStorage: userStorage = new Map<string, userConnections>();

const getUserConnections = (userId: string): userConnections | undefined => {
  return userStorage.get(userId);
};

const sendJson = (ws: MyWebSocket, data: WsResponseData): void => {
  if (typeof ws.cork !== "function") {
    logger.warn("Attempted to send message to closed or invalid WebSocket");
    return;
  }
  try {
    ws.cork(() => {
      ws.send(makeJson(data));
    });
  } catch (e) {
    logger.error({ err: e }, "Error in sendJson:");
    try {
      ws.close();
    } catch (closeError) {
      logger.error(
        { err: closeError },
        "Error closing WebSocket after send failure:",
      );
    }
  }
};

const setUserConnections = (
  userId: string,
  connection: userConnections,
): void => {
  userStorage.set(userId, connection);
};

const getOnlineUser = (usersOnline: string[]): string[] => {
  const onlineUsers: string[] = [];
  for (const userId of usersOnline) {
    if (userStorage.has(userId)) onlineUsers.push(userId);
  }
  return onlineUsers;
};

const closeAllWs = async (): Promise<void> => {
  for (const ws of wsStorage) {
    const userData: UserData = ws.getUserData();

    const token = userData["token"] ?? "";
    if (token !== "" && typeof token === "string")
      await redis.del(`auth:ws:${token}`);
    try {
      ws.end(4201);
    } catch (e) {
      logger.error({ err: e }, "closeAllWs error");
    }
  }
  wsStorage.clear();
  userStorage.clear();
};

// const handlePong = (ws: MyWebSocket) => {
//   // const { sessionId, userId } = ws.getUserData();
//   // if (sessionId && userId)  {
//   //     // updateExpiration(token)
//   //     sendJson(ws, {
//   //         event: 'service:pong',
//   //         status: 200,
//   //         payload: null,
//   //     });
//   // }
//   // logger.info('handlePong');
//   sendJson(ws, {
//     event: "service:pong",
//     status: 200,
//     payload: null,
//   });
// };

const unAuthorizedMessage = (): WsResponseData => ({
  event: "service:error",
  status: "4001",
  data: null,
  timestamp: Date.now(),
  error: {
    code: 4001,
    message: `Session expired. Please login again.`,
  },
});

const ab2str = (
  buffer: ArrayBuffer,
  encoding: BufferEncoding | undefined = "utf8",
): string => Buffer.from(buffer).toString(encoding);

const closeExpiredSession = (ws: MyWebSocket): void => {
  ws.cork(() => {
    try {
      ws.send(makeJson(unAuthorizedMessage()));
      ws.end(4001);
    } catch (e) {
      logger.error({ err: e }, "Error ws send unAuthorizedMessage");
    }
  });
};

const onMessage = async (
  ws: MyWebSocket,
  wsMessage: ArrayBuffer,
  isBinary: boolean,
): Promise<void> => {
  // logger.info('new onMessage');

  if (isBinary) {
    logger.error("onMessage isBinary is not supported");
    return;
  }
  const jsonMessage = ab2str(wsMessage);
  const userData = ws.getUserData() as UserConnection;

  const token = userData.token;
  if (token !== "" && typeof token === "string") {
    await updateExpiration(token)
      .then(() => {
        logger.info("Expiration updated");
      })
      .catch((error: unknown) => {
        logger.error({ err: error }, "Error update expiration");
      });
  }
  if (jsonMessage === "ping") {
    try {
      ws.send("pong");
    } catch (e) {
      logger.error({ err: e }, "Error ws send pong");
    }
    return;
  }
  let event = "";
  let timestamp = 0;

  try {
    const parsedMessage = JSON.parse(jsonMessage) as WsMessage;
    const message = WsMessageSchema(parsedMessage);
    if (message instanceof type.errors) {
      // hover summary to see validation errors
      console.error(message.summary);
      throw new Error(message.summary);
    }
    // if (token) tokenData = await redis.getex(`auth:ws:${token}`, 'EX', 120);
    // let message = null;
    // const userData = ws.getUserData();
    let session = null;
    const { sessionId, userId } = userData;
    if (sessionId !== undefined && userId !== undefined) {
      // logger.info(`onMessage userData.sessionId: ${userData.sessionId}`);
      // logger.info(`onMessage userData.userId: ${userData.userId}`);
      session = await wsSessionHandler(sessionId, userId);
    }
    if (session === null) {
      closeExpiredSession(ws);
    } else if (typeof message.event === "string") {
      event = message.event;
      timestamp = message.timestamp;
      const result = await wsApiHandler(message, ws, userData, session);
      if (result !== null) sendJson(ws, result);
      else {
        logger.error("onMessage result is null");
        sendJson(ws, {
          status: "404",
          error: {
            code: 404,
            message: "Event not found",
          },
          event: message.event,
          timestamp: message.timestamp,
          data: null,
        });
      }
    } else {
      logger.error("onMessage message is null or message.event is null");
      sendJson(ws, {
        status: "404",
        error: {
          code: 404,
          message: "Message is null or message.event is null",
        },
        event: message.event,
        timestamp: message.timestamp,
        data: null,
      });
    }
  } catch (err: unknown) {
    logger.error({ err }, "Error parse onMessage");
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "E_VALIDATION_ERROR"
    ) {
      sendJson(ws, {
        status: "422",
        error: {
          code: 422,
          message: "Validation failure",
          //TODO: add messages for validation errors
          messages: {
            message: "Validation failure",
          },
        },
        event: event,
        timestamp: timestamp,
        data: null,
      });
    } else {
      sendJson(ws, {
        status: "500",
        error: {
          code: 500,
          message: "Internal server error",
        },
        event: event,
        timestamp: timestamp,
        data: null,
      });
    }
  }
};

const onClose = async (
  ws: MyWebSocket,
  code: number,
  message: ArrayBuffer,
): Promise<void> => {
  logger.info("onClose code:", code);
  logger.info("onClose message:", message);
  try {
    const userData = ws.getUserData() as UserConnection;
    const token = userData.token;
    if (token !== "") await redis.del(`auth:ws:${token}`);
    wsStorage.delete(ws);
    // const userData = ws.getUserData();
    logger.info(userData);

    const { userId, sessionId, uuid } = userData;

    if (userId !== undefined && sessionId !== undefined) {
      wsEventEmitter.emit("user_disconnected", {
        userId: userId,
        sessionId: sessionId,
        uuid: uuid,
        code: code,
        timestamp: Date.now(),
      });
      const userConnection = getUserConnections(userId);
      if (userConnection !== undefined) {
        userConnection.connections.delete(uuid);
        if (userConnection.connections.size === 0) {
          userStorage.delete(String(userData.userId));
          // broadcastOnline(userData.userId, 'offline');
        }
      }
    }
  } catch (e) {
    logger.error({ err: e }, "Error onClose");
  }
};

const updateExpiration = async (token: string): Promise<void> => {
  await redis.expire(`auth:ws:${token}`, 120);
};

const onOpen = (ws: MyWebSocket): void => {
  try {
    logger.info("onOpen ws");
    const userData: UserConnection = ws.getUserData() as UserConnection;
    // const token = userData.token;

    if (userData.userId !== undefined || userData.sessionId !== undefined) {
      const errorMessage = unAuthorizedMessage();
      logger.info(errorMessage);
      ws.cork(() => {
        try {
          ws.send(
            JSON.stringify(errorMessage, (_, v: unknown) =>
              typeof v === "bigint" ? v.toString() : v,
            ),
          );
          ws.end(4001);
        } catch (e) {
          logger.error({ err: e }, "Error sending unauthorized message:");
        }
      });

      return;
    }

    const broadcastMessage = {
      event: "service:connection_established",
      status: "200",
      error: null,
      timestamp: Date.now(),
      data: {
        socket_id: userData.uuid,
        activity_timeout: 30,
      },
    };
    // ws.subscribe(`user:${userData.userId}`);
    // ws.subscribe(`change_online`);
    sendJson(ws, broadcastMessage);
    wsStorage.add(ws);
    logger.info(`onOpen ws userId: ${String(userData.userId)} `);

    const userConnection = getUserConnections(String(userData.userId));
    if (userConnection !== undefined) {
      userConnection.connections.set(userData.uuid, ws);
      //     ip: userData.ip,
      //     userAgent: userData.userAgent,
      //     connection: ws,
      //   });
    } else {
      const userConnections: userConnections = {
        ip: userData.ip,
        userAgent: userData.userAgent,
        connections: new Map([[userData.uuid, ws]]),
      };
      setUserConnections(String(userData.userId), userConnections);
      // broadcastOnline(userData.userId, 'online');
    }

    wsEventEmitter.emit("user_connected", {
      userId: userData.userId,
      sessionId: userData.sessionId,
      uuid: userData.uuid,
      ip: userData.ip,
      userAgent: userData.userAgent,
      timestamp: Date.now(),
      ws,
    });

    logger.info("onOpen ws end");
  } catch (e) {
    logger.error({ err: e }, "Error in onOpen:");
    try {
      ws.end(4001);
    } catch (closeError) {
      logger.error({ err: closeError }, "Error closing connection:");
    }
  }
};

const checkUserAccess = async (
  token: string,
): Promise<{ sessionId: string; userId: number | string } | null> => {
  if (token === "") return null;
  try {
    const tokenData = await redis.get(`auth:ws:${token}`);
    if (tokenData === null) return null;

    const userData = JSON.parse(tokenData) as {
      sessionId: string | undefined;
      userId: number | string | undefined;
    };
    const { sessionId, userId } = userData;
    if (
      sessionId === undefined ||
      userId === undefined ||
      userId === 0 ||
      sessionId === ""
    )
      return null;

    const sessionData = await redis.get(
      `session:${String(userId)}:${sessionId}`,
    );
    if (sessionData === null) return null;

    const sessionInfo = JSON.parse(sessionData) as SessionInfo;
    const data: SessionData = sessionInfo.data;
    if ("userId" in data && String(data["userId"]) === String(userId))
      return { sessionId, userId };

    return null;
  } catch (error) {
    logger.error({ err: error }, "Error checking user access:");
    return null;
  }
};

const checkToken = (token: string): boolean =>
  token !== "" &&
  token.length === configApp.accessTokenLength &&
  /^[a-zA-Z0-9]+$/.test(token);

const handleUpgrade = async (
  res: HttpResponse,
  req: HttpRequest,
  context: us_socket_context_t,
): Promise<void> => {
  logger.info("handleUpgrade");
  let aborted: boolean = false as boolean;
  res.onAborted(() => {
    logger.warn("Client aborted before operation completed");
    aborted = true;
  });
  const secWebsocketKey = req.getHeader("sec-websocket-key");
  const secWebsocketProtocol = req.getHeader("sec-websocket-protocol");
  const secWebsocketExtensions = req.getHeader("sec-websocket-extensions");
  const userAgent = req.getHeader("user-agent");
  const ip = getIP(req, res);
  const token = req.getParameter(0);
  // Token validation
  if (token === undefined || !checkToken(token)) {
    res.writeStatus("401 Unauthorized").end("Invalid token format");
    return;
  }
  const dataAccess = await checkUserAccess(token);

  if (!aborted) {
    res.cork(() => {
      const userData: UserData = {
        ip: ip,
        ip2: ab2str(res.getProxiedRemoteAddressAsText()),
        token: token,
        user: null,
        uuid: generateUUID(),
        sessionId: dataAccess !== null ? dataAccess.sessionId : undefined,
        userId: dataAccess !== null ? String(dataAccess.userId) : undefined,
        timeStart: Date.now(),
        userAgent,
      };
      res.upgrade(
        userData,
        secWebsocketKey,
        secWebsocketProtocol,
        secWebsocketExtensions,
        context,
      );
    });
  }
};

export {
  onMessage,
  onOpen,
  onClose,
  handleUpgrade,
  closeAllWs,
  getUserConnections,
  getOnlineUser,
};
