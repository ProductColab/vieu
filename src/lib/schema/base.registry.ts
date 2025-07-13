import * as z from "zod";
import React from "react";
import { safeToJSONSchema, getOptionsFromSchema } from "./schema.utils";
import type { $ZodRegistry } from "zod/v4/core";

/**
 * Base metadata that all view types share
 */
export type BaseMetadata = {
  /** Display label for the field */
  label: string;
};

/**
 * Generic option type for selects, filters, etc.
 */
export type ViewOption = {
  /** The actual value to be stored */
  value: string;
  /** Human-readable label for the option */
  label: string;
};

/**
 * Factory function type for creating registries
 * @template T - The metadata type extending BaseMetadata
 */
export type RegistryFactory<T extends BaseMetadata> = () => $ZodRegistry<T>;

/**
 * Creates a new Zod registry for the specified metadata type
 * @template T - The metadata type extending BaseMetadata
 * @returns A new Zod registry instance
 */
export function createRegistry<T extends BaseMetadata>(): $ZodRegistry<T> {
  return z.registry<T>();
}

/**
 * Base props interface that all component types share
 * @template T - The metadata type extending BaseMetadata
 */
export interface BaseComponentProps<T extends BaseMetadata> {
  /** The Zod schema for this field */
  schema: z.ZodType;
  /** Metadata associated with this field */
  metadata: T;
  /** Current value of the field */
  value: unknown;
  /** Name/key of the field */
  fieldName: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Function type for rendering a component
 * @template T - The metadata type extending BaseMetadata
 * @template P - The props type extending BaseComponentProps
 */
export type ComponentFunction<
  T extends BaseMetadata,
  P extends BaseComponentProps<T>
> = (props: P) => React.ReactElement;

/**
 * Map of component type strings to their corresponding render functions
 * @template T - The metadata type extending BaseMetadata
 * @template P - The props type extending BaseComponentProps
 */
export type ComponentMap<
  T extends BaseMetadata,
  P extends BaseComponentProps<T>
> = {
  [key: string]: ComponentFunction<T, P>;
};

/**
 * Function type for determining component type from schema and metadata
 * @template T - The metadata type extending BaseMetadata
 */
export type ComponentTypeGetter<T extends BaseMetadata> = (
  schema: z.ZodType,
  metadata: T
) => string;

/**
 * Function type for building component props
 * @template T - The metadata type extending BaseMetadata
 * @template P - The props type extending BaseComponentProps
 */
export type PropsBuilder<
  T extends BaseMetadata,
  P extends BaseComponentProps<T>
> = (
  schema: z.ZodType,
  metadata: T,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
) => P;

/**
 * Function type for dispatching component rendering
 * @template T - The metadata type extending BaseMetadata
 * @template _P - The props type extending BaseComponentProps (unused in signature)
 */
export type ComponentDispatcher<
  T extends BaseMetadata,
  _P extends BaseComponentProps<T>
> = (
  schema: z.ZodType,
  metadata: T,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
) => React.ReactElement;

/**
 * Infers the basic type from a Zod schema by converting to JSON Schema
 * @param schema - The Zod schema to analyze
 * @returns A string representing the inferred type
 */
export function inferSchemaType(schema: z.ZodType): string {
  const jsonSchema = safeToJSONSchema(schema);
  if (!jsonSchema) return "text";

  if (jsonSchema.type === "string") return "string";
  if (jsonSchema.type === "number" || jsonSchema.type === "integer")
    return "number";
  if (jsonSchema.type === "boolean") return "boolean";
  if (jsonSchema.type === "array") return "array";
  if (jsonSchema.type === "object") return "object";

  return "text";
}

/**
 * Generic input type inference that works for any view type
 * Determines appropriate input type based on schema analysis
 * @param schema - The Zod schema to analyze
 * @param explicitType - Optional explicit type override
 * @returns The inferred input type
 */
export function getGenericInputType(
  schema: z.ZodType,
  explicitType?: string
): string {
  if (explicitType) return explicitType;

  const jsonSchema = safeToJSONSchema(schema);
  if (!jsonSchema) return "text";

  // Check if it has options (enum/union) - should be select
  const options = getOptionsFromSchema(schema);
  if (options && options.length > 0) return "select";

  // Check format for specific input types
  if (jsonSchema.format === "email") return "email";
  if (jsonSchema.format === "uri") return "url";
  if (jsonSchema.type === "number" || jsonSchema.type === "integer")
    return "number";
  if (jsonSchema.type === "boolean") return "boolean";

  return "text";
}

/**
 * Generic type mapping for component types
 * Maps generic input types to view-specific component types
 */
export type ComponentTypeMap = {
  [inputType: string]: string;
};

/**
 * Creates a component type getter function using a type mapping
 * @param typeMapping - Map of generic input types to view-specific component types
 * @param getExplicitType - Optional function to extract explicit type from metadata
 * @returns A component type getter function
 */
export function createComponentTypeGetter<T extends BaseMetadata>(
  typeMapping: ComponentTypeMap,
  getExplicitType?: (metadata: T) => string | undefined
): ComponentTypeGetter<T> {
  return (schema: z.ZodType, metadata: T): string => {
    const explicitType = getExplicitType?.(metadata);
    const genericInputType = getGenericInputType(schema, explicitType);

    // Map generic type to view-specific component type
    return typeMapping[genericInputType] || typeMapping["text"] || "default";
  };
}

/**
 * Creates a component dispatcher function that routes to appropriate components
 * @template T - The metadata type extending BaseMetadata
 * @template P - The props type extending BaseComponentProps
 * @param componentMap - Map of component types to render functions
 * @param getComponentType - Function to determine component type
 * @param buildProps - Function to build component props
 * @returns A dispatcher function that renders the appropriate component
 */
export function createComponentDispatcher<
  T extends BaseMetadata,
  P extends BaseComponentProps<T>
>(
  componentMap: ComponentMap<T, P>,
  getComponentType: ComponentTypeGetter<T>,
  buildProps: PropsBuilder<T, P>
): ComponentDispatcher<T, P> {
  return (
    schema: z.ZodType,
    metadata: T,
    value: unknown,
    fieldName: string,
    className?: string,
    extraProps?: unknown
  ) => {
    const componentType = getComponentType(schema, metadata);
    const props = buildProps(
      schema,
      metadata,
      value,
      fieldName,
      className,
      extraProps
    );

    return componentMap[componentType](props);
  };
}

/**
 * Function type for rendering components with metadata
 * @template T - The metadata type extending BaseMetadata
 */
export type RenderFunction<T extends BaseMetadata> = (
  schema: z.ZodType,
  metadata: T,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
) => React.ReactElement;

/**
 * Function type for retrieving metadata from registry
 * @template T - The metadata type extending BaseMetadata
 */
export type GetFunction<T extends BaseMetadata> = (
  schema: z.ZodType
) => T | undefined;

/**
 * Complete view registry interface containing all necessary functions
 * @template T - The metadata type extending BaseMetadata
 */
export interface ViewRegistry<T extends BaseMetadata> {
  /** The underlying Zod registry */
  registry: $ZodRegistry<T>;
  /** Function to retrieve metadata for a schema */
  get: GetFunction<T>;
  /** Function to determine component type */
  getComponentType: ComponentTypeGetter<T>;
  /** Function to render components */
  render: RenderFunction<T>;
}

/**
 * Creates a complete view registry with all necessary functions
 * @template T - The metadata type extending BaseMetadata
 * @template P - The props type extending BaseComponentProps
 * @param componentMap - Map of component types to render functions
 * @param getComponentType - Function to determine component type
 * @param buildProps - Function to build component props
 * @returns A complete view registry instance
 */
export function createViewRegistry<
  T extends BaseMetadata,
  P extends BaseComponentProps<T>
>(
  componentMap: ComponentMap<T, P>,
  getComponentType: ComponentTypeGetter<T>,
  buildProps: PropsBuilder<T, P>
): ViewRegistry<T> {
  const registry = createRegistry<T>();
  const dispatcher = createComponentDispatcher(
    componentMap,
    getComponentType,
    buildProps
  );

  return {
    registry,
    get: (schema: z.ZodType) => registry.get(schema) as T | undefined,
    getComponentType: (schema: z.ZodType, metadata: T) =>
      getComponentType(schema, metadata) as string,
    render: dispatcher,
  };
}
