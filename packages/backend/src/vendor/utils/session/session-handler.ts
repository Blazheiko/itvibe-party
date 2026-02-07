// import redis from '#database/redis.js';
// import { DateTime } from "luxon";
import crypto from "node:crypto";

import type {
  HttpContext,
  Session,
  SessionData,
  SessionInfo,
  // WsContext,
} from "#vendor/types/types.js";
import sessionConfig from "#config/session.js";
import {
  saveSession,
  getSession,
  updateSessionData,
  changeSessionData,
  destroySession,
  destroyAllSessions,
} from "#vendor/utils/session/redis-session-storage.js";
import logger from "#vendor/utils/logger.js";
import {
  createSignedToken,
  verifySignedToken,
} from "#vendor/utils/session/token-handler.js";
import { normalizeUserId } from "#vendor/utils/helpers/normalize-user-id.js";
import type { ResponseData } from "#vendor/types/types.js";

logger.info(`Session storage: ${sessionConfig.storage}`);

const generateSessionId = (): string => crypto.randomUUID();

/**
 * Sanitizes Redis keys for protection against injections
 * Allowed characters only: letters, digits, hyphen, underscore, colon
 */
// const sanitizeRedisKey = (key: string): string => {
//     if (!/^[a-zA-Z0-9:_*-]+$/.test(key)) {
//         logger.error(`Invalid Redis key format: ${key}`);
//         throw new Error(`Invalid Redis key format`);
//     }
//     return key;
// };

const createSessionInfo = async (
  data: SessionData = {}
): Promise<SessionInfo> => {
  const session: SessionInfo = {
    id: generateSessionId(),
    data,
    createdAt: new Date().toISOString(),
    // expiresAt: DateTime.now().plus({ seconds: sessionConfig.age }).toISO(),
  };

  await saveSession(session);

  return session;
};

const createCookieValue = (
  sessionId: string,
  userId: string | undefined
): string =>
  userId !== undefined ? `${userId}.${sessionId}` : `0.${sessionId}`;

const updateContextWithNewSession = (
  context: HttpContext,
  newSessionInfo: SessionInfo,
  userId: string | undefined,
  responseData: ResponseData
): SessionInfo => {
  const cookieValue = createCookieValue(newSessionInfo.id, userId);
  const signedToken = createSignedToken(cookieValue);

  responseData.setCookie(sessionConfig.cookieName, signedToken, {
    path: sessionConfig.cookie.path,
    httpOnly: sessionConfig.cookie.httpOnly,
    secure: sessionConfig.cookie.secure,
    maxAge: sessionConfig.age,
    sameSite: sessionConfig.cookie.sameSite,
    expires: new Date(Date.now() + sessionConfig.age * 1000),
  });

  context.session.sessionInfo = newSessionInfo;

  return newSessionInfo;
};

export const sessionHandler = async (
  context: HttpContext,
  accessToken: string | undefined,
  userId: string | bigint | number | undefined
): Promise<void> => {
  const { responseData } = context;

  // Normalize userId at the beginning for security
  const normalizedUserId: string | undefined =
    userId !== undefined ? normalizeUserId(userId) : undefined;

  let sessionId = undefined;
  let cookieUserId = undefined;

  if (normalizedUserId === undefined && accessToken !== undefined) {
    const verifiedData = verifySignedToken(accessToken);

    if (verifiedData !== null) {
      ({ cookieUserId, sessionId } = verifiedData);

      // Validate cookieUserId from token
      try {
        cookieUserId = normalizeUserId(cookieUserId);
      } catch (err: unknown) {
        logger.error({ err }, "Invalid cookieUserId from token");
        logger.error(
          {
            cookieUserId,
            ip: context.httpData.ip,
            userAgent: context.httpData.headers.get("user-agent"),
          },
          "Invalid cookieUserId from token"
        );
        cookieUserId = undefined;
        sessionId = undefined;
      }
    } else {
      logger.warn(
        {
          ip: context.httpData.ip,
          userAgent: context.httpData.headers.get("user-agent"),
        },
        "Invalid access token"
      );
    }
  }

  let sessionInfo: SessionInfo | null = null;

  if (sessionId !== undefined) {
    sessionInfo = await getSession(sessionId, cookieUserId ?? "0");
  }

  sessionInfo ??= await createSessionInfo({
    userId: normalizedUserId ?? undefined,
  });

  const finalUserId = normalizedUserId ?? cookieUserId;
  const cookieValue = createCookieValue(sessionInfo.id, finalUserId);

  const signedToken = createSignedToken(cookieValue);

  // responseData.deleteCookie(sessionConfig.cookieName)
  responseData.setCookie(sessionConfig.cookieName, signedToken, {
    path: sessionConfig.cookie.path,
    httpOnly: sessionConfig.cookie.httpOnly,
    secure: sessionConfig.cookie.secure,
    maxAge: sessionConfig.age,
    sameSite: sessionConfig.cookie.sameSite,
    expires: new Date(Date.now() + sessionConfig.age * 1000),
  });

  const contextUserId = finalUserId ?? "0";

  context.session.sessionInfo = sessionInfo;
  context.session.updateSessionData = async (newData: SessionData): Promise<SessionInfo | null> =>
    await updateSessionData(sessionInfo?.id, newData, contextUserId);
  context.session.changeSessionData = async (newData: SessionData): Promise<SessionInfo | null> =>
    await changeSessionData(sessionInfo?.id, newData, contextUserId);
  context.session.destroySession = async (): Promise<void> => {
    await destroySession(sessionInfo?.id, contextUserId);
  };
  
  context.auth.getUserId = (): string | null => {
    if (sessionInfo === null) return null;
    if (sessionInfo.data['userId'] === undefined) return null;
    return sessionInfo.data['userId'] as string;
  };
  context.auth.check = (): boolean => Boolean(sessionInfo?.data['userId']);
  context.auth.login = async (userId: string | bigint | number | undefined): Promise<boolean> => {
    if (userId === undefined) return false;
    try {
      const oldSessionId = sessionInfo?.id;
      const oldUserId = sessionInfo?.data['userId'];

      // Destroy old session with normalized userId
      if (oldSessionId !== undefined) {
        const normalizedOldUserId = normalizeUserId(String(oldUserId));
        await destroySession(oldSessionId, normalizedOldUserId);
      }

      // Normalize new userId for security
      const normalizedNewUserId = normalizeUserId(userId);
      const newSessionInfo = await createSessionInfo({
        userId: normalizedNewUserId,
      });

      sessionInfo = updateContextWithNewSession(
        context,
        newSessionInfo,
        normalizedNewUserId,
        responseData
      );

      logger.info(`User logged in`, {
        userId: normalizedNewUserId,
        sessionId: newSessionInfo.id,
      });

      return true;
    } catch (err) {
      logger.error({ err }, "Login error:");
      throw err;
    }
  };

  context.auth.logout = async (): Promise<boolean> => {
    try {
      const userId = sessionInfo?.data['userId'];
      let sessionId = undefined;
      if (userId !== undefined) {
        sessionId = sessionInfo?.id;
        if (sessionId !== undefined) {
          const normalizedUserId = normalizeUserId(userId as string);
          await destroySession(sessionId, normalizedUserId);

          logger.info(`User logged out`, {
            userId: normalizedUserId,
            sessionId,
          });
        }
      }

      const newSessionInfo = await createSessionInfo({});

      sessionInfo = updateContextWithNewSession(
        context,
        newSessionInfo,
        undefined,
        responseData
      );

      return true;
    } catch (err) {
      logger.error({ err, userId, sessionId }, "Logout error");
      throw err;
    }
  };

  context.auth.logoutAll = async (): Promise<number> => {
    try {
      let deletedCount = 0;
      const userId = sessionInfo?.data['userId'];
      let sessionId = undefined;
      if (userId === undefined || userId === "0") return 0;

      sessionId = sessionInfo?.id;
      if (sessionId !== undefined) {
        deletedCount = await destroyAllSessions(userId as string);

        logger.info(`User ${userId as string} logged out all sessions ${String(deletedCount)}`);
      }

      const newSessionInfo = await createSessionInfo({});

      sessionInfo = updateContextWithNewSession(
        context,
        newSessionInfo,
        undefined,
        responseData
      );

      return deletedCount;
    } catch (err) {
      logger.error({ err, userId, sessionId }, "Logout error");
      throw err;
    }
  };
};

export const wsSessionHandler = async (
  sessionId: string,
  userId: string | bigint | number
): Promise<Session | null> => {
  try {
    // Normalize userId for protection against type coercion attacks
    const normalizedUserId = normalizeUserId(userId);

    const sessionInfo = await getSession(sessionId, normalizedUserId);

    if (sessionInfo === null) {
      logger.warn(
        {
          sessionId,
          userId: normalizedUserId,
        },
        "Session not found"
      );
      return null;
    }

    // Normalize userId from session and strictly compare
    const sessionUserId = normalizeUserId(sessionInfo.data['userId'] as string);

    // CRITICAL: use strict comparison !== for protection against type coercion
    if (sessionUserId !== normalizedUserId) {
      logger.error(
        {
          sessionId,
          expectedUserId: normalizedUserId,
          expectedType: typeof normalizedUserId,
          actualUserId: sessionUserId,
          actualType: typeof sessionUserId,
          rawSessionUserId: sessionInfo.data['userId'],
        },
        `Session userId mismatch - potential security breach`
      );
      return null;
    }

    return {
      sessionInfo: sessionInfo,
      updateSessionData: async (newData: SessionData) =>
        await updateSessionData(sessionInfo.id, newData, normalizedUserId),
      changeSessionData: async (newData: SessionData) =>
        await changeSessionData(sessionInfo.id, newData, normalizedUserId),
      destroySession: async (): Promise<void> => {
        await destroySession(sessionInfo.id, normalizedUserId);
      },
      destroyAllSessions: async (): Promise<number> => {
        return await destroyAllSessions(normalizedUserId);
      },
    };
  } catch (err) {
    logger.error({ err, sessionId, userId }, "wsSessionHandler error");
    return null;
  }
};

// export default { sessionHandler, wsSessionHandler };
