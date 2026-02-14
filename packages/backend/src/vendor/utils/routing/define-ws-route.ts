import type { Type } from "@arktype/type";
import type {
  RouteItem,
  RouteConfig,
  InferPayload,
  Payload,
  WsContext,
} from "#vendor/types/types.js";

/**
 * Тип возвращаемого значения handler — расширен object для совместимости с interface response-типами
 */
type WsHandlerReturn = Promise<Payload | object> | Payload | object;

/**
 * Типизированный WS handler с payload выведенным из validator
 */
type TypedWsHandler<TValidator extends Type | string | undefined> =
  TValidator extends Type
    ? {
        bivarianceHack(context: WsContext<InferPayload<TValidator>>): WsHandlerReturn;
      }["bivarianceHack"]
    : {
        bivarianceHack(context: WsContext<any>): WsHandlerReturn;
      }["bivarianceHack"];

/**
 * Конфигурация WS роута с типизированным handler.
 * method задаётся автоматически как "ws".
 */
type WsRouteConfig<TValidator extends Type | string | undefined = undefined> = Omit<
  RouteConfig<TValidator>,
  "method"
> & {
  handler: TypedWsHandler<TValidator>;
};

/**
 * Создаёт типизированный WS роут.
 * Тип payload в handler автоматически выводится из validator.
 */
export function defineWsRoute<TValidator extends Type | string | undefined = undefined>(
  config: WsRouteConfig<TValidator>,
): RouteItem {
  return {
    method: "ws",
    ...config,
  } as RouteItem;
}
