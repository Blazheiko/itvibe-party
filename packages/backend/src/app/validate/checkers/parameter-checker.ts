// @ts-nocheck
/**
 * Validates URL path parameters using ArkType schemas.
 */

import { type } from "@arktype/type";

/**
 * Error class for parameter validation failures
 */
export class ParameterValidationError extends Error {
  public readonly code: string = "E_PARAMETER_VALIDATION_ERROR";
  public readonly parameterName: string;
  public readonly parameterValue: string;

  constructor(parameterName: string, parameterValue: string, message?: string) {
    super(
      message ??
        `Invalid parameter: ${parameterName} with value: ${parameterValue}`,
    );
    this.name = "ParameterValidationError";
    this.parameterName = parameterName;
    this.parameterValue = parameterValue;
  }
}

/**
 * Parameter value schema:
 * - Max 256 characters
 * - Valid characters: letters, numbers, hyphens, underscores, dots, slashes
 */
const ParameterSchema = type("string <= 256").and(type(/^[a-zA-Z0-9\-_./]*$/));

/**
 * Validates URL path parameter value
 * @param value - Parameter value to validate
 * @param parameterName - Name of the parameter being validated
 * @throws {ParameterValidationError} When parameter validation fails
 */
export function validateParameter(value: string, parameterName?: string): void {
  const paramName = parameterName ?? "unknown";

  if (value.length === 0) return;

  const result = ParameterSchema(value);

  if (result instanceof type.errors) {
    throw new ParameterValidationError(
      paramName,
      value,
      `Parameter '${paramName}' validation failed: ${result.summary}`,
    );
  }
}
