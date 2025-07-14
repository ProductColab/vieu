import * as z from "zod";
import React from "react";
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
 * Form section definition
 */
export type FormSection = {
  /** Display title for the section */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional icon for the section (SVG element) */
  icon?: React.ReactElement;
  /** Order for section display (lower numbers first) */
  order: number;
  /** Whether the section can be collapsed */
  collapsible?: boolean;
};

/**
 * Form sections registry
 */
export type FormSections = Record<string, FormSection>;

/**
 * Default section for unsectioned fields
 */
export const DEFAULT_SECTION_ID = "default";

/**
 * Default section definition
 */
export const DEFAULT_SECTION: FormSection = {
  title: "General Information",
  description: "General form fields",
  order: 999,
  collapsible: true,
};

/**
 * Schema-to-sections mapping registry
 */
const schemaSectionsRegistry = new Map<z.ZodType, FormSections>();

/**
 * Register sections for a schema
 * @param schema - The Zod schema
 * @param sections - Form sections definition
 */
export const registerFormSections = (
  schema: z.ZodType,
  sections: FormSections
): void => {
  // Always include the default section
  const sectionsWithDefault = {
    ...sections,
    [DEFAULT_SECTION_ID]: DEFAULT_SECTION,
  };
  schemaSectionsRegistry.set(schema, sectionsWithDefault);
};

/**
 * Get sections for a schema
 * @param schema - The Zod schema
 * @returns Form sections or undefined if not found
 */
export const getFormSections = (schema: z.ZodType): FormSections | undefined => {
  return schemaSectionsRegistry.get(schema);
};

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
  /** Section ID this field belongs to */
  section?: string;
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
 * Helper to group fields by section
 * @param fieldsMetadata - Object mapping field names to their metadata
 * @param sections - Available sections registry
 * @returns Object mapping section IDs to arrays of field names
 */
export const groupFieldsBySection = (
  fieldsMetadata: Record<string, { form?: FormFieldMetadata }>,
  sections: FormSections
): Record<string, string[]> => {
  const sectionGroups: Record<string, string[]> = {};
  
  // Initialize all defined sections
  Object.keys(sections).forEach(sectionId => {
    sectionGroups[sectionId] = [];
  });
  
  // Group fields by section
  Object.entries(fieldsMetadata).forEach(([fieldName, metadata]) => {
    const sectionId = metadata.form?.section || DEFAULT_SECTION_ID;
    if (!sectionGroups[sectionId]) {
      sectionGroups[sectionId] = [];
    }
    sectionGroups[sectionId].push(fieldName);
  });
  
  // Remove empty sections
  Object.keys(sectionGroups).forEach(sectionId => {
    if (sectionGroups[sectionId].length === 0) {
      delete sectionGroups[sectionId];
    }
  });
  
  return sectionGroups;
};

/**
 * Helper to get ordered sections
 * @param sections - Available sections registry
 * @param usedSectionIds - Array of section IDs that are actually used
 * @returns Array of sections ordered by their order property
 */
export const getOrderedSections = (
  sections: FormSections,
  usedSectionIds: string[]
): Array<{ id: string; section: FormSection }> => {
  return usedSectionIds
    .map(id => ({ id, section: sections[id] }))
    .filter(item => item.section) // Filter out undefined sections
    .sort((a, b) => a.section.order - b.section.order);
};

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
