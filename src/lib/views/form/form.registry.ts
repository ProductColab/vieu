import * as z from "zod";
import React from "react";
import type { ComponentType } from "react";
import type { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import type { UseQueryResult } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
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

// =============================================================================
// ENHANCED FIELD TYPES (from form.types.ts)
// =============================================================================

export type FieldType = 
  | "text" 
  | "email" 
  | "password" 
  | "number" 
  | "textarea" 
  | "select" 
  | "multiselect"
  | "asyncselect"
  | "tags"
  | "date" 
  | "daterange"
  | "datetime"
  | "time"
  | "phone"
  | "uuid"
  | "currency" 
  | "boolean"
  | "file"
  | "custom"
  | "url"
  | "object"
  | "readonly";

export interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}

export type FormMode = "create" | "update" | "view";

// =============================================================================
// ENHANCED METADATA (extending BaseMetadata properly)
// =============================================================================

/**
 * Enhanced form field metadata that extends BaseMetadata with comprehensive form options
 */
export interface FormFieldMetadata extends BaseMetadata {
  // Core metadata (label inherited from BaseMetadata)
  description?: string;
  placeholder?: string;
  
  // Field behavior
  fieldType?: FieldType;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Section reference (keeping the better approach)
  section?: string;
  
  // UI customization
  icon?: LucideIcon;
  order?: number;
  
  // Type-specific options
  rows?: number; // textarea
  accept?: string; // file
  min?: number; // number/currency
  max?: number; // number/currency
  step?: number; // number/currency
  minLength?: number; // text
  maxLength?: number; // text
  pattern?: string | RegExp; // text
  multiple?: boolean; // select/file
  searchable?: boolean; // select
  clearable?: boolean; // select
  
  // Currency-specific options
  currency?: string; // currency code (USD, EUR, etc.)
  locale?: string; // locale for formatting (en-US, de-DE, etc.)
  precision?: number; // decimal places for currency
  allowNegative?: boolean; // whether negative values are allowed
  
  // Data options
  options?: SelectOption<any>[];
  query?: UseQueryResult<SelectOption<any>[], Error>;
  valueField?: string;
  labelField?: string;
  secondaryTextField?: string;
  
  // Validation
  default?: any;
  examples?: any[];
  
  // Conditional display (keeping existing ConditionalDisplay)
  showWhen?: ConditionalDisplay;
  hideWhen?: ConditionalDisplay;
  
  // Advanced field options
  enumLabels?: Record<string, string>;
  booleanType?: "checkbox" | "switch";
  maxTags?: number;
  suggestions?: string[];
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  delimiter?: string;
  validateTag?: (tag: string) => boolean | string;
  disabledDates?: (date: Date) => boolean;
  format?: (value: any) => string;
  parse?: (value: string) => any;
}

// =============================================================================
// ENHANCED COMPONENT PROPS (extending BaseComponentProps properly)
// =============================================================================

/**
 * Enhanced form component props that extends BaseComponentProps
 */
export interface FormComponentProps<T extends FieldValues = FieldValues> extends BaseComponentProps<FormFieldMetadata> {
  /** Error message to display for the field */
  error?: string;
  /** Callback function when field value changes */
  onChange: (fieldName: string, value: unknown) => void;
  /** React Hook Form instance */
  form: UseFormReturn<T>;
  /** Form mode */
  mode: FormMode;
}

// =============================================================================
// COMPONENT TYPE MAPPING (using the base system properly)
// =============================================================================

/**
 * Enhanced component type mapping from field types to form components
 */
export const formComponentTypeMap: ComponentTypeMap = {
  text: "input",
  email: "input",
  password: "input",
  number: "input",
  url: "input",
  phone: "input",
  uuid: "input",
  textarea: "textarea",
  select: "select",
  multiselect: "multiselect",
  asyncselect: "asyncselect",
  tags: "tags",
  boolean: "checkbox",
  date: "date",
  daterange: "daterange",
  datetime: "datetime",
  time: "time",
  currency: "currency",
  file: "file",
  custom: "custom",
  object: "object",
  readonly: "readonly",
};

/**
 * Enhanced input type inference (using the base system)
 */
export const getFormInputType = (
  schema: z.ZodType,
  metadata: FormFieldMetadata
): string => {
  return getGenericInputType(schema, metadata.fieldType);
};

/**
 * Form component type getter using the base system
 */
export const getFormComponentType = createComponentTypeGetter<FormFieldMetadata>(
  formComponentTypeMap,
  (metadata) => metadata.fieldType
);

/**
 * Enhanced form props builder using the base system
 */
export const buildFormProps: PropsBuilder<FormFieldMetadata, FormComponentProps> = (
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
    form: props.form as UseFormReturn<any>,
    mode: props.mode as FormMode || "create",
  };
};

// =============================================================================
// FORM SECTIONS (keeping the better approach)
// =============================================================================

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactElement | ComponentType<{ className?: string }>;
  order: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  // Note: NO fields array - fields reference sections instead
}

export type FormSections = Record<string, FormSection>;

export const DEFAULT_SECTION_ID = "default";

export const DEFAULT_SECTION: FormSection = {
  id: DEFAULT_SECTION_ID,
  title: "General Information",
  description: "General form fields",
  order: 999,
  collapsible: true,
};

// =============================================================================
// REGISTRY SYSTEM (using the base system properly)
// =============================================================================

/**
 * Schema-to-sections mapping registry
 */
const schemaSectionsRegistry = new Map<z.ZodType, FormSections>();

/**
 * Register sections for a schema
 */
export const registerFormSections = (
  schema: z.ZodType,
  sections: FormSections
): void => {
  const sectionsWithDefault = {
    ...sections,
    [DEFAULT_SECTION_ID]: DEFAULT_SECTION,
  };
  schemaSectionsRegistry.set(schema, sectionsWithDefault);
};

/**
 * Get sections for a schema
 */
export const getFormSections = (schema: z.ZodType): FormSections | undefined => {
  return schemaSectionsRegistry.get(schema);
};

/**
 * Create the enhanced form registry system using the base system
 */
const formRegistrySystem = createViewRegistry(
  {} as ComponentMap<FormFieldMetadata, FormComponentProps>, // Will be populated by components
  getFormComponentType,
  buildFormProps
);

/**
 * Export the form registry system
 */
export { formRegistrySystem };

/**
 * The form registry instance for registering form field schemas
 */
export const formRegistry = formRegistrySystem.registry;

/**
 * Function to get and render a component from a schema
 */
export const getComponentFromSchema = formRegistrySystem.render;

// =============================================================================
// UTILITY FUNCTIONS (enhanced but keeping the same approach)
// =============================================================================

/**
 * Group fields by section
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
 * Get ordered sections
 */
export const getOrderedSections = (
  sections: FormSections,
  usedSectionIds: string[]
): Array<{ id: string; section: FormSection }> => {
  return usedSectionIds
    .map(id => ({ id, section: sections[id] }))
    .filter(item => item.section)
    .sort((a, b) => a.section.order - b.section.order);
};

/**
 * Get field names ordered by section and field order
 */
export const getOrderedFields = (
  fieldsMetadata: Record<string, { form?: FormFieldMetadata }>,
  sections: FormSections
): string[] => {
  const fieldsBySection = groupFieldsBySection(fieldsMetadata, sections);
  const orderedSections = getOrderedSections(sections, Object.keys(fieldsBySection));
  
  const orderedFields: string[] = [];
  
  orderedSections.forEach(({ id: sectionId }) => {
    const sectionFields = fieldsBySection[sectionId] || [];
    
    // Sort fields within section by order if specified
    sectionFields.sort((a, b) => {
      const aOrder = fieldsMetadata[a]?.form?.order ?? 999;
      const bOrder = fieldsMetadata[b]?.form?.order ?? 999;
      return aOrder - bOrder;
    });
    
    orderedFields.push(...sectionFields);
  });
  
  return orderedFields;
};

// =============================================================================
// FORM CONFIGURATION (enhanced types)
// =============================================================================

export type FormLayout = "single" | "sections" | "stepper";
export type FormPresentation = "page" | "dialog" | "sheet";
export type FormValidationTiming = "realtime" | "onSubmit" | "onBlur";

export interface FormConfig {
  mode: FormMode;
  layout: FormLayout;
  presentation: FormPresentation;
  validation: FormValidationTiming;
  autosave?: boolean;
  title?: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enableDirtyCheck?: boolean;
  confirmOnCancel?: boolean;
}

export interface FormDefinition<T extends FieldValues = FieldValues> {
  schema: z.ZodType<T>;
  config: FormConfig;
  defaultValues?: Partial<T>;
}

/**
 * Create a complete form definition with registry data
 */
export const createFormDefinition = <T extends FieldValues>(
  schema: z.ZodType<T>,
  config: FormConfig,
  defaultValues?: Partial<T>
): FormDefinition<T> => {
  return {
    schema,
    config,
    defaultValues,
  };
};

// =============================================================================
// EXPORTS (keeping compatibility)
// =============================================================================

export { createViewRegistry, type ComponentMap, type PropsBuilder };
