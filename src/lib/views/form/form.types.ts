import type { ComponentType } from "react";
import type { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import type { z } from "zod";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Extract keys that have string values and are valid paths
export type StringKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends string | null | undefined ? K : never;
}[Path<T>];

// Extract keys that have number values and are valid paths
export type NumberKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends number | null | undefined ? K : never;
}[Path<T>];

// Extract keys that have boolean values and are valid paths
export type BooleanKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends boolean | null | undefined ? K : never;
}[Path<T>];

// Extract keys that have Date values and are valid paths
export type DateKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends Date | string | null | undefined ? K : never;
}[Path<T>];

// Extract keys that have File or FileList values and are valid paths
export type FileKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends File | FileList | null | undefined ? K : never;
}[Path<T>];

// Extract keys that have array values and are valid paths
export type ArrayKeys<T> = {
  [K in Path<T>]: PathValue<T, K> extends Array<infer _> | null | undefined ? K : never;
}[Path<T>];

// Get the element type of an array
export type ArrayElement<T> = T extends Array<infer E> ? E : never;

// Deep partial type
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// JSON Schema types based on Zod v4's output
export interface ZodJSONSchema {
  type?: string;
  format?: string;
  pattern?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  required?: string[];
  default?: unknown;
  const?: unknown;
  examples?: unknown[];
  properties?: Record<string, ZodJSONSchema>;
  items?: ZodJSONSchema;
  title?: string;
  description?: string;
  $ref?: string;
  $defs?: Record<string, ZodJSONSchema>;
}

export type UIMetadata<T = unknown> = {
  // Standard JSON Schema fields
  title?: string;
  description?: string;
  examples?: T[];
  default?: T;
  
  // Custom UI fields
  fieldType?: FieldType;
  icon?: LucideIcon;
  order?: number;
  section?: string;
  sectionTitle?: string;
  placeholder?: string;
  
  // Async data
  query?: UseQueryResult<SelectOption<T>[], Error>;
  valueField?: string;
  labelField?: string;
  secondaryTextField?: string;
  
  // UI behavior
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Custom validators/formatters
  disabledDates?: (date: Date) => boolean;
  format?: (value: T) => string;
  parse?: (value: string) => T;
  
  // Type-specific metadata
  enumLabels?: Record<string, string>;
  rows?: number;
  accept?: string;
  booleanType?: "checkbox" | "switch";
  
  // Tags field metadata
  maxTags?: number;
  suggestions?: string[];
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  delimiter?: string;
  validateTag?: (tag: string) => boolean | string;
}

export interface FieldInfo<T extends FieldValues = FieldValues, K extends Path<T> = Path<T>> {
  name: K;
  zodSchema?: z.ZodType<PathValue<T, K>>;
  jsonSchema: ZodJSONSchema;
  metadata: UIMetadata<PathValue<T, K>>;
  
  // Extracted JSON Schema properties
  type: string;
  format?: string;
  pattern?: string;
  enum?: PathValue<T, K>[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  required: boolean;
  default?: PathValue<T, K>;
  const?: PathValue<T, K>;
  examples?: PathValue<T, K>[];
}

export interface SectionInfo<T extends FieldValues> {
  fields: FieldInfo<T>[];
  title?: string;
  icon?: any;
}

// =============================================================================
// CORE FORM TYPES
// =============================================================================

export type FormMode = "create" | "update" | "view";
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

// =============================================================================
// FIELD TYPES
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

// =============================================================================
// BASE FIELD OPTIONS
// =============================================================================

export interface BaseFieldOptions<T extends FieldValues, K extends Path<T>> {
  required?: boolean;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: PathValue<T, K>;
  showWhen?: ConditionalLogic<T>;
  hideWhen?: ConditionalLogic<T>;
  validation?: FieldValidation<T, K>;
}

// =============================================================================
// SPECIFIC FIELD OPTIONS
// =============================================================================

export type TextFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  autoComplete?: string;
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
};

export type NumberFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export interface SelectOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}

export type SelectFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  options: SelectOption<PathValue<T, K>>[];
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export type MultiSelectFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  options: SelectOption<ArrayElement<PathValue<T, K>>>[];
  maxSelections?: number;
  searchable?: boolean;
  clearable?: boolean;
  closeOnSelect?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export type TagsFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  maxTags?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  suggestions?: string[];
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  delimiter?: string; // For parsing pasted text (default: comma)
  validateTag?: (tag: string) => boolean | string;
}

export type SelectorFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  component: ComponentType<any>;
  queryKey?: string;
  valueField?: string;
  labelField?: string;
  searchField?: string;
  multiple?: boolean;
  props?: Record<string, unknown>;
}

export type DateFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  includeTime?: boolean;
  disabledDates?: Date[] | ((date: Date) => boolean);
}

export type DateRangeFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  includeTime?: boolean;
  maxDays?: number;
  disabledDates?: Date[] | ((date: Date) => boolean);
}

export type BooleanFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  variant?: "checkbox" | "switch";
  size?: "sm" | "md" | "lg";
  labelPosition?: "left" | "right";
  trueLabel?: string;
  falseLabel?: string;
}

export type FileFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  preview?: boolean;
  uploadUrl?: string;
  onUpload?: (file: File) => Promise<string>;
}

export type CurrencyFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  currency?: string;
  locale?: string;
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
}

export type CustomFieldOptions<T extends FieldValues, K extends Path<T>> 
  = BaseFieldOptions<T, K> & {
  component: ComponentType<CustomFieldProps<T, K>>;
  props?: Record<string, unknown>;
}

// =============================================================================
// CUSTOM FIELD PROPS
// =============================================================================

export type CustomFieldProps<T extends FieldValues, K extends Path<T>> = {
  value: PathValue<T, K>;
  onChange: (value: PathValue<T, K>) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  form: UseFormReturn<T>;
  field: FormField<T, K>;
}

// =============================================================================
// FIELD VALIDATION
// =============================================================================

export type FieldValidation<T extends FieldValues, K extends Path<T>> = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: { value: RegExp; message: string } | RegExp;
  validate?: (value: PathValue<T, K>) => boolean | string | Promise<boolean | string>;
  deps?: Path<T>[];
}

// =============================================================================
// CONDITIONAL LOGIC
// =============================================================================

// Type-safe operators based on value types
export type EqualsOperator = "equals" | "not_equals";
export type StringOperator = "contains" | "not_contains";
export type NumericOperator = "greater_than" | "less_than";
export type ArrayOperator = "in" | "not_in";

export type AllOperators = EqualsOperator | StringOperator | NumericOperator | ArrayOperator;

export interface ConditionalLogic<T extends FieldValues, K extends Path<T> = Path<T>> {
  field: K;
  operator: AllOperators;
  value: PathValue<T, K> | PathValue<T, K>[];
  and?: ConditionalLogic<T>[];
  or?: ConditionalLogic<T>[];
}


export interface ConditionalField<T extends FieldValues> {
  conditional?: ConditionalLogic<T>;
  options?: {
    showWhen?: ConditionalLogic<T>;
    hideWhen?: ConditionalLogic<T>;
  };
}

export interface ConditionalSection<T extends FieldValues> {
  conditional?: ConditionalLogic<T>;
}

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export interface FormField<T extends FieldValues, K extends Path<T> = Path<T>> {
  id: K;
  type: FieldType;
  label: string;
  validation?: FieldValidation<T, K>;
  conditional?: ConditionalLogic<T>;
  options?: BaseFieldOptions<T, K>;
}

// Specific field type definitions - use Path<T> for storage flexibility
export interface TextField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "text" | "email" | "password" | "textarea";
  options?: TextFieldOptions<T, K>;
}

export interface NumberField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "number";
  options?: NumberFieldOptions<T, K>;
}

export interface SelectField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "select";
  options?: SelectFieldOptions<T, K>;
}

export interface MultiSelectField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "multiselect";
  options?: MultiSelectFieldOptions<T, K>;
}

export interface TagsField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "tags";
  options?: TagsFieldOptions<T, K>;
}

export interface DateField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "date";
  options?: DateFieldOptions<T, K>;
}

export interface DateRangeField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "daterange";
  options?: DateRangeFieldOptions<T, K>;
}

export interface BooleanField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "boolean";
  options?: BooleanFieldOptions<T, K>;
}

export interface FileField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "file";
  options?: FileFieldOptions<T, K>;
}

export interface CurrencyField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "currency";
  options?: CurrencyFieldOptions<T, K>;
}

export interface SelectorField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "custom";
  options?: SelectorFieldOptions<T, K>;
}

export interface AsyncSelectFieldOptions<T extends FieldValues, K extends Path<T>, TData = any> 
  extends BaseFieldOptions<T, K> {
  query: UseQueryResult<TData[], Error> | UseQueryResult<{ data: TData[] }, Error>; // Support both direct array and paginated response
  valueField?: string; // Which field to use as value (default: 'id')
  labelField?: string; // Which field to use as label (default: 'name')
  secondaryTextField?: string; // Which field to use for secondary text/description
  getSecondaryText?: (item: TData) => string | null; // Function to generate secondary text from the item
  icon?: ComponentType<{ className?: string }>; // Icon to display next to each option
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  onSearch?: (query: string) => void;
}

export interface AsyncSelectField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "asyncselect";
  options?: AsyncSelectFieldOptions<T, K>;
}

export interface CustomField<T extends FieldValues, K extends Path<T>> 
  extends FormField<T, K> {
  type: "custom";
  options?: CustomFieldOptions<T, K>;
}

export type AnyFormField<T extends FieldValues> = 
  | TextField<T, Path<T>>
  | NumberField<T, Path<T>>
  | SelectField<T, Path<T>>
  | MultiSelectField<T, Path<T>>
  | AsyncSelectField<T, Path<T>>
  | TagsField<T, Path<T>>
  | DateField<T, Path<T>>
  | DateRangeField<T, Path<T>>
  | BooleanField<T, Path<T>>
  | FileField<T, Path<T>>
  | CurrencyField<T, Path<T>>
  | SelectorField<T, Path<T>>
  | CustomField<T, Path<T>>;

export type AnyFormFieldOptions<T extends FieldValues> = 
  | TextFieldOptions<T, Path<T>>
  | NumberFieldOptions<T, Path<T>>
  | SelectFieldOptions<T, Path<T>>
  | MultiSelectFieldOptions<T, Path<T>>
  | AsyncSelectFieldOptions<T, Path<T>>
  | TagsFieldOptions<T, Path<T>>
  | DateFieldOptions<T, Path<T>>
  | DateRangeFieldOptions<T, Path<T>>
  | BooleanFieldOptions<T, Path<T>>
  | FileFieldOptions<T, Path<T>>
  | CurrencyFieldOptions<T, Path<T>>
  | SelectorFieldOptions<T, Path<T>>
  | CustomFieldOptions<T, Path<T>>;

// =============================================================================
// SECTION DEFINITION
// =============================================================================

export interface FormSection<T extends FieldValues> {
  id: string;
  title: string;
  description?: string;
  fields: AnyFormField<T>[];
  conditional?: ConditionalLogic<T>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

// =============================================================================
// FORM DEFINITION
// =============================================================================

export interface FormDefinition<T extends FieldValues, TResponse = unknown, TError extends Error = Error, TMutationData = unknown> {
  fields: AnyFormField<T>[];
  sections: FormSection<T>[];
  config: FormConfig;
  schema?: z.ZodType<T>;
  defaultValues?: DeepPartial<T>;
  submitActions?: SubmitActionConfig<T, TResponse, TError, TMutationData> | MultipleSubmitActions<T, TResponse, TError, TMutationData>;
}

// =============================================================================
// FORM COMPONENT PROPS
// =============================================================================

export interface FormProps<T extends FieldValues> {
  definition: FormDefinition<T>;
  onSubmit?: (data: T) => void | Promise<void>; // Optional - mutations take precedence
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
  form?: UseFormReturn<T>;
}

// =============================================================================
// FIELD COMPONENT PROPS
// =============================================================================

export interface FieldComponentProps<T extends FieldValues, K extends Path<T>> {
  field: FormField<T, K>;
  form: UseFormReturn<T>;
  mode: FormMode;
  className?: string;
}

// =============================================================================
// FORM CONTEXT
// =============================================================================

export interface FormContextValue<T extends FieldValues> {
  mode: FormMode;
  config: FormConfig;
  form: UseFormReturn<T>;
  definition: FormDefinition<T>;
  isLoading: boolean;
}

// =============================================================================
// FORM SUBMISSION & MUTATION TYPES
// =============================================================================

export type SubmitActionType = "create" | "update" | "delete" | "custom";

export interface SubmitActionConfig<TData extends FieldValues, TResponse = unknown, TError = Error, TMutationData = TData> {
  /** Type of action being performed */
  type: SubmitActionType;
  
  /** TanStack Query mutation result */
  mutation: UseMutationResult<TResponse, TError, TMutationData>;
  
  /** Optional transformation of form data before mutation */
  transformData?: (data: TData) => TMutationData;
  
  /** Success callback after mutation completes */
  onSuccess?: (response: TResponse, data: TData) => void;
  
  /** Error callback if mutation fails */
  onError?: (error: TError, data: TData) => void;
  
  /** Loading callback during mutation */
  onLoading?: (isLoading: boolean) => void;
  
  /** Custom submit button text */
  submitText?: string;
  
  /** Whether to show loading state on form */
  showLoadingState?: boolean;
  
  /** Whether to disable form during submission */
  disableFormDuringSubmit?: boolean;
  
  /** Whether to reset form after successful submission */
  resetOnSuccess?: boolean;
  
  /** Whether to close dialog/sheet after successful submission */
  closeOnSuccess?: boolean;
}

export interface MultipleSubmitActions<TData extends FieldValues, TResponse = unknown, TError = Error, TMutationData = TData> {
  /** Primary submit action (default) */
  primary: SubmitActionConfig<TData, TResponse, TError, TMutationData>;
  
  /** Secondary submit actions (additional buttons) */
  secondary?: SubmitActionConfig<TData, TResponse, TError, TMutationData>[];
}

// =============================================================================
// FORM SUBMISSION STATE
// =============================================================================

export interface SubmissionState {
  /** Whether any mutation is currently loading */
  isSubmitting: boolean;
  
  /** Which action is currently being executed */
  activeAction?: string;
  
  /** Last submission error */
  error?: Error | null;
  
  /** Whether the last submission was successful */
  isSuccess: boolean;
  
  /** Last successful response */
  lastResponse?: unknown;
}
