import { z } from "zod";

// =====================================
// Error Message Constants
// =====================================

const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  ENTER_TEXT: "Please enter text",
  ENTER_NUMBER: "Please enter a valid number",
  SELECT_OPTION: "Please select an option",
  SELECT_AT_LEAST_ONE: "Please select at least one option",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_URL: "Please enter a valid URL",
  INVALID_UUID: "Please enter a valid UUID",
  INVALID_GUID: "Please enter a valid GUID",
  INVALID_CUID: "Please enter a valid CUID",
  INVALID_FORMAT: "Please enter a valid format",
  INVALID_FORMAT_GENERIC: "Invalid format",
  INVALID_VALUE: "Invalid value",
  TOO_SMALL: "Too small",
  TOO_LARGE: "Too large",
  AVAILABLE_OPTIONS: "the available options",
} as const;

const MESSAGE_TEMPLATES = {
  EXPECTED_RECEIVED: (expected: string, received: string) =>
    `Expected ${expected}, received ${received}`,
  MIN_CHARACTERS: (min: number, inclusive: boolean) =>
    inclusive
      ? `Must be at least ${min} characters`
      : `Must be more than ${min} characters`,
  MIN_NUMBER: (min: number | bigint, inclusive: boolean) =>
    inclusive ? `Must be at least ${min}` : `Must be greater than ${min}`,
  MIN_ITEMS: (min: number | bigint, inclusive: boolean) =>
    inclusive
      ? `Must have at least ${min} items`
      : `Must have more than ${min} items`,
  MAX_CHARACTERS: (max: number | bigint, inclusive: boolean) =>
    inclusive
      ? `Must be no more than ${max} characters`
      : `Must be less than ${max} characters`,
  MAX_NUMBER: (max: number | bigint, inclusive: boolean) =>
    inclusive ? `Must be no more than ${max}` : `Must be less than ${max}`,
  MAX_ITEMS: (max: number | bigint, inclusive: boolean) =>
    inclusive
      ? `Must have no more than ${max} items`
      : `Must have less than ${max} items`,
  SELECT_FROM_OPTIONS: (values: string[]) =>
    `Please select one of: ${values.join(", ")}`,
  UNKNOWN_FIELD: (key: string) => `Unknown field: ${key}`,
  UNKNOWN_FIELDS: (keys: string) => `Unknown fields: ${keys}`,
  MULTIPLE_OF: (divisor: number) => `Must be a multiple of ${divisor}`,
  FIELD_REQUIRED: (fieldLabel: string) => `${fieldLabel} is required`,
} as const;

// =====================================
// Custom Error Map
// =====================================

/**
 * Vieu's custom error map for user-friendly error messages
 * This provides better default messages than Zod's technical defaults
 */
export const vieuErrorMap: z.ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type":
      if (issue.expected === "string") {
        if (issue.input === undefined || issue.input === null) {
          return { message: ERROR_MESSAGES.REQUIRED };
        }
        return { message: ERROR_MESSAGES.ENTER_TEXT };
      }
      if (issue.expected === "number") {
        if (issue.input === undefined || issue.input === null) {
          return { message: ERROR_MESSAGES.REQUIRED };
        }
        return { message: ERROR_MESSAGES.ENTER_NUMBER };
      }
      if (issue.expected === "boolean") {
        return { message: ERROR_MESSAGES.SELECT_OPTION };
      }
      if (issue.expected === "array") {
        return { message: ERROR_MESSAGES.SELECT_AT_LEAST_ONE };
      }
      return {
        message: MESSAGE_TEMPLATES.EXPECTED_RECEIVED(
          issue.expected,
          typeof issue.input
        ),
      };

    case "invalid_format":
      if (issue.format === "email") {
        return { message: ERROR_MESSAGES.INVALID_EMAIL };
      }
      if (issue.format === "url") {
        return { message: ERROR_MESSAGES.INVALID_URL };
      }
      if (issue.format === "uuid") {
        return { message: ERROR_MESSAGES.INVALID_UUID };
      }
      if (issue.format === "guid") {
        return { message: ERROR_MESSAGES.INVALID_GUID };
      }
      if (issue.format === "cuid") {
        return { message: ERROR_MESSAGES.INVALID_CUID };
      }
      if (issue.format === "regex") {
        return { message: ERROR_MESSAGES.INVALID_FORMAT };
      }
      return { message: ERROR_MESSAGES.INVALID_FORMAT_GENERIC };

    case "too_small":
      if (issue.origin === "string") {
        if (issue.minimum === 1) {
          return { message: ERROR_MESSAGES.REQUIRED };
        }
        return {
          message: MESSAGE_TEMPLATES.MIN_CHARACTERS(
            issue.minimum as number,
            issue.inclusive || false
          ),
        };
      }
      if (issue.origin === "number") {
        return {
          message: MESSAGE_TEMPLATES.MIN_NUMBER(
            issue.minimum,
            issue.inclusive || false
          ),
        };
      }
      if (issue.origin === "array") {
        if (issue.minimum === 1) {
          return { message: ERROR_MESSAGES.SELECT_AT_LEAST_ONE };
        }
        return {
          message: MESSAGE_TEMPLATES.MIN_ITEMS(
            issue.minimum,
            issue.inclusive || false
          ),
        };
      }
      return { message: ERROR_MESSAGES.TOO_SMALL };

    case "too_big":
      if (issue.origin === "string") {
        return {
          message: MESSAGE_TEMPLATES.MAX_CHARACTERS(
            issue.maximum,
            issue.inclusive || false
          ),
        };
      }
      if (issue.origin === "number") {
        return {
          message: MESSAGE_TEMPLATES.MAX_NUMBER(
            issue.maximum,
            issue.inclusive || false
          ),
        };
      }
      if (issue.origin === "array") {
        return {
          message: MESSAGE_TEMPLATES.MAX_ITEMS(
            issue.maximum,
            issue.inclusive || false
          ),
        };
      }
      return { message: ERROR_MESSAGES.TOO_LARGE };

    case "invalid_value":
      return {
        message: MESSAGE_TEMPLATES.SELECT_FROM_OPTIONS(
          issue.values?.map(String) || [ERROR_MESSAGES.AVAILABLE_OPTIONS]
        ),
      };

    case "custom":
      return { message: issue.message || ERROR_MESSAGES.INVALID_VALUE };

    case "unrecognized_keys":
      const keys = issue.keys.join(", ");
      return {
        message:
          keys.length === 1
            ? MESSAGE_TEMPLATES.UNKNOWN_FIELD(keys)
            : MESSAGE_TEMPLATES.UNKNOWN_FIELDS(keys),
      };

    case "invalid_union":
      return { message: ERROR_MESSAGES.INVALID_VALUE };

    case "not_multiple_of":
      return { message: MESSAGE_TEMPLATES.MULTIPLE_OF(issue.divisor) };

    default:
      // Fall back to default error message
      return undefined;
  }
};

/**
 * Initialize the global error map for vieu
 * Call this once in your app initialization
 */
export function initializeVieuErrorMap(): void {
  z.config({
    customError: vieuErrorMap,
  });
}

/**
 * Create a context-aware error map for specific forms/components
 * Allows customization per component while maintaining global defaults
 */
export function createContextualErrorMap(
  fieldLabels: Record<string, string> = {},
  customMessages: Record<string, string> = {}
): z.ZodErrorMap {
  return (issue) => {
    // Check for custom messages first
    const path = issue.path?.join(".") || "";
    if (customMessages[path]) {
      return { message: customMessages[path] };
    }

    // Use field labels for better context
    const fieldName = issue.path?.[issue.path.length - 1] as string;
    const fieldLabel = fieldLabels[fieldName] || fieldName;

    // Enhanced messages with field context
    switch (issue.code) {
      case "invalid_type":
        if (
          issue.expected === "string" &&
          (issue.input === undefined || issue.input === null)
        ) {
          return { message: MESSAGE_TEMPLATES.FIELD_REQUIRED(fieldLabel) };
        }
        break;
      case "too_small":
        if (issue.origin === "string" && issue.minimum === 1) {
          return { message: MESSAGE_TEMPLATES.FIELD_REQUIRED(fieldLabel) };
        }
        break;
    }

    // Fall back to global error map
    return vieuErrorMap(issue);
  };
}
