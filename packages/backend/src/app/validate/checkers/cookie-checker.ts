/**
 * Validates HTTP cookie names and values using ArkType schemas.
 *
 * Cookie validation according to RFC 6265:
 * - Cookie names should be valid tokens (letters, numbers, hyphens, underscores)
 * - Cookie values can contain most characters but are typically URL-encoded
 * - Practical limits are enforced to prevent abuse and ensure compatibility
 */

import { type } from "@arktype/type";
import appConfig from "#config/app.js";

/**
 * Cookie name schema:
 * - Must be a non-empty string
 * - Max length from appConfig.reasonableCookieKeyLimit
 * - Valid characters: letters, numbers, hyphens, underscores (RFC 6265 token subset)
 */
const CookieNameSchema = type("string >= 1")
  .and(type(/^[a-zA-Z0-9_-]+$/))
  .narrow((value, ctx) => {
    if (value.length >= appConfig.reasonableCookieKeyLimit) {
      return ctx.mustBe(
        `at most ${String(appConfig.reasonableCookieKeyLimit - 1)} characters`,
      );
    }
    return true;
  });

/**
 * Cookie value schema:
 * - Must be a non-empty string
 * - Max length from appConfig.reasonableCookieLimit
 * - Valid characters: alphanumeric + safe symbols (RFC 6265 safe subset)
 *
 * Excluded dangerous characters for injection prevention:
 * - Semicolon (;) - cookie separator, can be used for cookie injection
 * - Comma (,) - can be used as separator in some contexts
 * - Double quote (") - can be used for escaping and injection
 * - Backslash (\) - escape character, can be used for injection
 * - Control characters (0x00-0x1F, 0x7F) and whitespace
 */
const CookieValueSchema = type("string >= 1")
  .and(type(/^[a-zA-Z0-9\-_.~*+/=%]+$/))
  .narrow((value, ctx) => {
    if (value.length >= appConfig.reasonableCookieLimit) {
      return ctx.mustBe(
        `at most ${String(appConfig.reasonableCookieLimit - 1)} characters`,
      );
    }
    return true;
  });

/**
 * Pattern to validate percent-encoded sequences: % must be followed by exactly two hex digits
 */
const PercentEncodingSchema = type(/^(?:%[0-9A-Fa-f]{2}|[^%])*$/);

/**
 * Validates HTTP cookie name and value
 * @param key - Cookie name to validate
 * @param value - Cookie value to validate
 * @returns true if both cookie name and value are valid, false otherwise
 */
export function validateCookie(key: string, value: string): boolean {
  if (value === "" || typeof value !== "string") return false;

  if (CookieValueSchema(value) instanceof type.errors) return false;

  if (
    value.includes("%") &&
    PercentEncodingSchema(value) instanceof type.errors
  ) {
    return false;
  }

  if (CookieNameSchema(key) instanceof type.errors) return false;

  return true;
}
