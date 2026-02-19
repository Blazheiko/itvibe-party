import type { Type } from "@arktype/type";
import type {
  RouteItem,
  RouteConfig,
  InferPayload,
  HandlerReturn,
  WsContext,
} from "#vendor/types/types.js";

/**
 * Типизированный WS handler с payload выведенным из validator
 */
type TypedWsHandler<TValidator extends Type | undefined> =
  TValidator extends Type
    ? (context: WsContext<InferPayload<TValidator>>) => HandlerReturn
    : (context: WsContext) => HandlerReturn;

/**
 * Конфигурация WS роута с типизированным handler.
 * method задаётся автоматически как "ws".
 */
type WsRouteConfig<TValidator extends Type | undefined = undefined> = Omit<
  RouteConfig<TValidator>,
  "method"
> & {
  handler: TypedWsHandler<TValidator>;
};

/**
 * Создаёт типизированный WS роут.
 * Тип payload в handler автоматически выводится из validator.
 */
export function defineWsRoute<TValidator extends Type | undefined = undefined>(
  config: WsRouteConfig<TValidator>,
): RouteItem {
  return {
    method: "ws",
    ...config,
  } as RouteItem;
}
