// @ts-nocheck
import type { HttpContext, WsContext } from "#vendor/types/types.js";

/**
 * Извлекает типизированный payload из контекста.
 * Тип payload выводится автоматически из generic параметра контекста.
 * Предполагает что валидация уже выполнена в server.ts
 */
export function getTypedPayload<TPayload>(
  context: HttpContext<TPayload> | WsContext<TPayload>
): TPayload{
  const payload = "httpData" in context 
    ? context.httpData.payload 
    : context.wsData.payload;
    
  if (payload === null) {
    throw new Error("Payload is missing");
  }
  
  return payload;
}

/**
 * Type guard для проверки что контекст является HttpContext
 */
export function isHttpContext<TPayload>(
  context: HttpContext<TPayload> | WsContext<TPayload>
): context is HttpContext<TPayload> {
  return "httpData" in context;
}

/**
 * Type guard для проверки что контекст является WsContext
 */
export function isWsContext<TPayload>(
  context: HttpContext<TPayload> | WsContext<TPayload>
): context is WsContext<TPayload> {
  return "wsData" in context;
}
