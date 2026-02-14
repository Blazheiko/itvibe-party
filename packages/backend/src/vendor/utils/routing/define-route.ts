import type { Type } from "@arktype/type";
import type {
  RouteItem,
  RouteConfig,
  InferPayload,
  Payload,
  HttpContext,
} from "#vendor/types/types.js";

/**
 * Тип возвращаемого значения handler — расширен object для совместимости с interface response-типами
 */
type HandlerReturn = Promise<Payload | object> | Payload | object;

/**
 * Типизированный handler с payload выведенным из validator
 */
type TypedHandler<TValidator extends Type | string | undefined> = TValidator extends Type
  ? {
      bivarianceHack(context: HttpContext<InferPayload<TValidator>>): HandlerReturn;
    }["bivarianceHack"]
  : {
      bivarianceHack(context: HttpContext<any>): HandlerReturn;
    }["bivarianceHack"];

/**
 * Конфигурация роута с типизированным handler
 */
interface TypedRouteConfig<
  TValidator extends Type | string | undefined,
> extends RouteConfig<TValidator> {
  handler: TypedHandler<TValidator>;
}

/**
 * Создаёт типизированный роут.
 * Тип payload в handler автоматически выводится из validator.
 *
 * @example
 * defineRoute({
 *   url: "/contact",
 *   method: "post",
 *   validator: CreateContactAsInputSchema,
 *   handler: (context) => {
 *     // context.httpData.payload типизирован как CreateContactAsInput
 *     const payload = getTypedPayload(context);
 *     return Promise.resolve({ status: true });
 *   },
 *   description: "Create contact",
 *   typeResponse: "ContactResponse",
 * })
 */
export function defineRoute<TValidator extends Type | string | undefined = undefined>(
  config: TypedRouteConfig<TValidator>,
): RouteItem {
  return config as RouteItem;
}
