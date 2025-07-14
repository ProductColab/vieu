"use client";

import * as z from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { createSchemaFieldRenderer } from "../../schema";
import { shouldShowField } from "../../schema/conditional.utils";
import {
  type FormFieldMetadata,
  type FormComponentProps,
  createViewRegistry,
  type ComponentMap,
  getFormComponentType,
  buildFormProps,
} from "./form.registry";
import {
  renderInputComponent,
  renderTextareaComponent,
  renderSelectComponent,
  renderCheckboxComponent,
} from "./fields";

/**
 * Form-specific component map mapping component types to render functions
 */
const formComponentMap: ComponentMap<FormFieldMetadata, FormComponentProps> = {
  input: renderInputComponent,
  textarea: renderTextareaComponent,
  select: renderSelectComponent,
  checkbox: renderCheckboxComponent,
};

/**
 * Complete form registry system created using the base system
 */
export const formRegistrySystem = createViewRegistry(
  formComponentMap,
  getFormComponentType,
  buildFormProps
);

/**
 * Form-specific field renderer
 */
export const FormFieldRenderer = createSchemaFieldRenderer(formRegistrySystem);

/**
 * Enhanced form field using shadcn form components with conditional display
 */
export const EnhancedFormField = ({
  schema,
  fieldName,
  control,
  watch,
}: {
  schema: z.ZodTypeAny;
  fieldName: string;
  control: any;
  watch: any;
}) => {
  const metadata = formRegistrySystem.get(schema);

  if (!metadata) {
    return (
      <div className="text-destructive text-sm">
        No form metadata found for field: {fieldName}
      </div>
    );
  }

  // Check conditional display logic
  if (metadata.showWhen) {
    const watchedValue = watch(metadata.showWhen.field);
    const allValues = watch();
    const shouldShow = shouldShowField(
      metadata.showWhen,
      watchedValue,
      allValues
    );

    if (!shouldShow) {
      return null;
    }
  }

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{metadata.label}</FormLabel>
          <FormControl>
            <FormFieldRenderer
              schema={schema}
              fieldName={fieldName}
              value={field.value}
              onChange={(_: string, value: unknown) => field.onChange(value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

/**
 * Export the form registry system components
 */
export const formRegistry = formRegistrySystem.registry;
export const getComponentFromSchema = formRegistrySystem.render;
