/**
 * Validates HTTP header names and values according to RFC 7230
 * using ArkType schemas for runtime validation.
 *
 * Note: RFC 7230 does not specify maximum lengths, but uWebSockets.js
 * has a default limit of 4 KB for the total size of all headers.
 * These limits are set to reasonable values that work well with uWebSockets.js
 */

import { type } from "@arktype/type";

/**
 * Header name schema:
 * - Must be a non-empty string
 * - Max 256 characters (most header names are 10-50 characters)
 * - Valid characters: letters, numbers, hyphens, underscores (RFC 7230 tchar subset)
 */
const HeaderNameSchema = type("string >= 1 & string <= 256").and(
  type(/^[a-zA-Z0-9\-_]+$/),
);

/**
 * Header value schema:
 * - Can be empty string (valid per RFC 7230)
 * - Max 3072 characters (uWebSockets.js default total header size is 4 KB)
 * - Valid characters: HTAB (0x09) + SP (0x20) + VCHAR (0x21-0x7E) excluding '%' (0x25)
 *
 * Note: Percent-encoding is not standard practice in HTTP header values per RFC 7230.
 * Prohibiting '%' simplifies validation and prevents potential security issues.
 */
const HeaderValueSchema = type("string <= 3072").and(
  // eslint-disable-next-line no-control-regex
  type(/^[\x09\x20-\x24\x26-\x7E]*$/),
);

/**
 * Validates HTTP header name
 * @param name - Header name to validate
 * @returns true if header name is valid, false otherwise
 */
export function validateHeaderName(name: string): boolean {
  return !(HeaderNameSchema(name) instanceof type.errors);
}

/**
 * Validates HTTP header value
 * @param value - Header value to validate
 * @returns true if header value is valid, false otherwise
 */
export function validateHeaderValue(value: string): boolean {
  return !(HeaderValueSchema(value) instanceof type.errors);
}

/**
 * Validates both header name and value
 * @param name - Header name to validate
 * @param value - Header value to validate
 * @returns true if both header name and value are valid, false otherwise
 */
export function validateHeader(name: string, value: string): boolean {
  return validateHeaderName(name) && validateHeaderValue(value);
}
