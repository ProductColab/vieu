import * as z from "zod";
import {
  type BaseMetadata,
  type BaseComponentProps,
  type ComponentMap,
  type PropsBuilder,
  type ComponentTypeMap,
  createViewRegistry,
  getGenericInputType,
  createComponentTypeGetter,
} from "../../schema";
import type { ConditionalDisplay } from "../../schema/conditional.types";

/**
 * Form-specific metadata extends base metadata
 */
export type FormFieldMetadata = BaseMetadata & {
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Specific input type for form fields */
  inputType?:
    | "text"
    | "email"
    | "number"
    | "password"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "checkbox";
  /** Number of rows for textarea fields */
  rows?: number;
  /** Conditional display logic */
  showWhen?: ConditionalDisplay;
};

/**
 * Form-specific component props extending base component props
 */
export type FormComponentProps = BaseComponentProps<FormFieldMetadata> & {
  /** Error message to display for the field */
  error?: string;
  /** Callback function when field value changes */
  onChange: (fieldName: string, value: unknown) => void;
};

/**
 * Form-specific type mapping from generic input types to form components
 */
export const formComponentTypeMap: ComponentTypeMap = {
  text: "input",
  email: "input",
  number: "input",
  url: "input",
  textarea: "textarea",
  select: "select",
  checkbox: "checkbox",
  boolean: "checkbox",
};

/**
 * Helper to get the final inputType (explicit or inferred) - now uses generic function
 * @param schema - The Zod schema to analyze
 * @param metadata - Form field metadata containing optional inputType
 * @returns The determined input type string
 */
export const getInputType = (
  schema: z.ZodType,
  metadata: FormFieldMetadata
): string => {
  return getGenericInputType(schema, metadata.inputType);
};

/**
 * Form-specific component type getter using the generic factory
 */
export const getFormComponentType =
  createComponentTypeGetter<FormFieldMetadata>(
    formComponentTypeMap,
    (metadata) => metadata.inputType
  );

/**
 * Form-specific props builder function
 * @param schema - The Zod schema for validation
 * @param metadata - Form field metadata
 * @param value - Current field value
 * @param fieldName - Name/key of the field
 * @param className - Optional CSS class name
 * @param error - Optional error message
 * @param onChange - Change handler function
 * @returns Complete form component props
 */
export const buildFormProps: PropsBuilder<
  FormFieldMetadata,
  FormComponentProps
> = (
  schema: z.ZodType,
  metadata: FormFieldMetadata,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
): FormComponentProps => {
  const props = (extraProps as Record<string, unknown>) || {};

  return {
    schema,
    metadata,
    value,
    fieldName,
    className,
    error: props.error as string | undefined,
    onChange: props.onChange as (fieldName: string, value: unknown) => void,
  };
};

// Export types and functions needed by components
export { createViewRegistry, type ComponentMap, type PropsBuilder };
