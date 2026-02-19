import type { Type } from "@arktype/type";
import type {
  RouteItem,
  RouteConfig,
  InferPayload,
  HandlerReturn,
  HttpContext,
} from "#vendor/types/types.js";

/**
 * Типизированный handler с payload выведенным из validator
 */
type TypedHandler<TValidator extends Type | undefined> = TValidator extends Type
  ? (context: HttpContext<InferPayload<TValidator>>) => HandlerReturn
  : (context: HttpContext) => HandlerReturn;

/**
 * Конфигурация роута с типизированным handler
 */
interface TypedRouteConfig<TValidator extends Type | undefined>
  extends RouteConfig<TValidator> {
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
 * })
 */
export function defineRoute<TValidator extends Type | undefined = undefined>(
  config: TypedRouteConfig<TValidator>,
): RouteItem {
  return config as RouteItem;
}
