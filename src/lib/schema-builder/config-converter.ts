import * as z from "zod";
import {
  defineSmartField,
  semanticFields,
  type FieldDefinition,
  type BaseFieldProps,
  type FieldContextOverrides,
} from "../schema/field-definition-v2";
import {
  createSmartEntity,
  type SmartEntityConfig,
} from "../schema/smart-field-adapter";

/**
 * JSON configuration for a field - uses existing types where possible
 */
export interface FieldConfigJSON {
  /** Field type - corresponds to semantic field types or custom */
  type: keyof typeof semanticFields | "custom";

  /** Field name/key */
  name: string;

  /** Base properties - matches existing BaseFieldProps */
  base?: Partial<BaseFieldProps>;

  /** Context overrides - matches existing FieldContextOverrides */
  contexts?: FieldContextOverrides;

  /** For custom fields - simple Zod schema definition */
  zodSchema?: {
    type: "string" | "number" | "boolean" | "date" | "enum" | "optional";
    constraints?: {
      min?: number;
      max?: number;
      email?: boolean;
      required?: boolean;
      values?: string[]; // For enum
    };
  };
}

/**
 * Complete entity configuration - reuses existing SmartEntityConfig structure
 */
export interface EntityConfigJSON extends Omit<SmartEntityConfig, "fields"> {
  /** Array of field configurations */
  fields: FieldConfigJSON[];
}

/**
 * Converts a simple Zod schema definition to actual Zod schema
 *
 * @param zodDef - The Zod schema definition object containing type and constraints
 * @returns A Zod schema instance based on the definition
 *
 * @example
 * ```typescript
 * const schema = createZodSchema({
 *   type: "string",
 *   constraints: { min: 3, email: true }
 * });
 * ```
 */
function createZodSchema(zodDef: FieldConfigJSON["zodSchema"]): z.ZodTypeAny {
  if (!zodDef) return z.string();

  let schema: z.ZodTypeAny;

  switch (zodDef.type) {
    case "string":
      schema = z.string();
      if (zodDef.constraints?.min)
        schema = (schema as z.ZodString).min(zodDef.constraints.min);
      if (zodDef.constraints?.email) schema = (schema as z.ZodString).email();
      break;
    case "number":
      schema = z.number();
      if (zodDef.constraints?.min)
        schema = (schema as z.ZodNumber).min(zodDef.constraints.min);
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "date":
      schema = z.date();
      break;
    case "enum":
      if (zodDef.constraints?.values) {
        schema = z.enum(zodDef.constraints.values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    case "optional":
      schema = z.string().optional();
      break;
    default:
      schema = z.string();
  }

  return zodDef.constraints?.required === false ? schema.optional() : schema;
}

/**
 * Converts JSON field config to existing FieldDefinition structure
 *
 * @param fieldConfig - The field configuration object to convert
 * @returns A FieldDefinition instance ready for use in entity schemas
 *
 * @remarks
 * This function handles both semantic fields (predefined field types) and custom fields.
 * For semantic fields, it uses the appropriate semantic field builder with proper parameters.
 * For custom fields, it creates a new field definition using the provided Zod schema.
 *
 * @example
 * ```typescript
 * const fieldDef = convertFieldConfig({
 *   type: "email",
 *   name: "userEmail",
 *   base: { label: "Email Address" },
 *   zodSchema: { type: "string", constraints: { email: true, required: true } }
 * });
 * ```
 */
export function convertFieldConfig(
  fieldConfig: FieldConfigJSON
): FieldDefinition {
  const { type, name, base, contexts, zodSchema } = fieldConfig;

  // Use semantic fields if available
  if (type !== "custom" && type in semanticFields) {
    const required = zodSchema?.constraints?.required !== false;
    let builder;

    // Handle different semantic field signatures
    if (type === "status" || type === "role") {
      const values = zodSchema?.constraints?.values || ["active", "inactive"];
      builder = semanticFields[type](values as [string, ...string[]], required);
    } else if (type === "createdAt" || type === "updatedAt") {
      builder = semanticFields[type]();
    } else {
      // personName, email, phone, age, bio
      builder = semanticFields[type](required);
    }

    // Apply base properties
    if (base) {
      builder = builder.base(base);
    }

    // Apply context overrides
    if (contexts) {
      builder = builder.contexts(contexts);
    }

    return builder.build();
  }

  // Handle custom fields
  const schema = createZodSchema(zodSchema);
  let builder = defineSmartField(schema, name);

  // Apply base properties
  if (base) {
    builder = builder.base(base);
  }

  // Apply context overrides
  if (contexts) {
    builder = builder.contexts(contexts);
  }

  return builder.build();
}

/**
 * Converts complete entity config to existing SmartEntityConfig structure
 *
 * @param entityConfig - The entity configuration object containing fields and metadata
 * @returns A SmartEntityConfig instance with converted field definitions
 *
 * @remarks
 * This function transforms the array-based field configuration into the object-based
 * structure expected by SmartEntityConfig, where fields are keyed by their names.
 *
 * @example
 * ```typescript
 * const smartConfig = convertEntityConfig({
 *   name: "User",
 *   fields: [
 *     { type: "email", name: "email" },
 *     { type: "personName", name: "fullName" }
 *   ]
 * });
 * ```
 */
export function convertEntityConfig(
  entityConfig: EntityConfigJSON
): SmartEntityConfig {
  // Convert fields array to fields object
  const fields: Record<string, FieldDefinition> = {};

  for (const fieldConfig of entityConfig.fields) {
    fields[fieldConfig.name] = convertFieldConfig(fieldConfig);
  }

  return {
    name: entityConfig.name,
    fields,
    transport: entityConfig.transport,
    serverActions: entityConfig.serverActions,
    cacheConfig: entityConfig.cacheConfig,
    validation: entityConfig.validation,
  };
}

/**
 * Main converter function - takes JSON config and returns working schemas
 *
 * @param entityConfig - The complete entity configuration in JSON format
 * @returns A fully configured smart entity ready for use
 *
 * @remarks
 * This is the primary entry point for converting JSON-based entity configurations
 * into working smart entities. It combines the conversion and creation steps into
 * a single convenient function.
 *
 * @example
 * ```typescript
 * const entity = createEntityFromConfig({
 *   name: "User",
 *   fields: [
 *     { type: "email", name: "email" },
 *     { type: "personName", name: "fullName" }
 *   ]
 * });
 *
 * // Use the entity for validation, forms, etc.
 * const result = entity.validate(userData);
 * ```
 */
export function createEntityFromConfig(entityConfig: EntityConfigJSON) {
  const smartEntityConfig = convertEntityConfig(entityConfig);
  return createSmartEntity(smartEntityConfig);
}
