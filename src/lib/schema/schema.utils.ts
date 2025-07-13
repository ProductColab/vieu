import { z } from "zod";

/**
 * Represents a field option with value and display label.
 * 
 * @public
 */
export interface FieldOption {
  /** The actual value of the option */
  readonly value: string;
  /** The display label for the option */
  readonly label: string;
}

/**
 * Safely converts a Zod schema to JSON Schema format with error handling.
 * 
 * @param schema - The Zod schema to convert
 * @returns The JSON Schema representation or null if conversion fails
 * 
 * @public
 */
export const safeToJSONSchema = (schema: z.ZodType) => {
  try {
    return z.toJSONSchema(schema, {
      unrepresentable: "any",
    });
  } catch (error) {
    console.warn("Failed to convert schema to JSON Schema:", error);
    return null;
  }
};

/**
 * Extracts field options from a Zod schema by analyzing its JSON Schema representation.
 * Supports enum schemas and union of literal values.
 * 
 * @param schema - The Zod schema to extract options from
 * @returns Array of field options or undefined if no options are found
 * 
 * @public
 */
export const getOptionsFromSchema = (
  schema: z.ZodType
): FieldOption[] | undefined => {
  const jsonSchema = safeToJSONSchema(schema);
  if (!jsonSchema) return undefined;

  // Handle enum schemas
  if ("enum" in jsonSchema && jsonSchema.enum) {
    return jsonSchema.enum.map((value) => ({
      value: String(value),
      label: String(value),
    }));
  }

  // Handle union of literals (oneOf/anyOf with const values)
  const unionArray = jsonSchema.oneOf || jsonSchema.anyOf;
  if (unionArray) {
    const constValues = unionArray
      .filter(
        (item) => typeof item === "object" && item !== null && "const" in item
      )
      .map((item) => item.const);

    if (constValues.length > 0) {
      return constValues.map((value) => ({
        value: String(value),
        label: String(value),
      }));
    }
  }

  return undefined;
};
