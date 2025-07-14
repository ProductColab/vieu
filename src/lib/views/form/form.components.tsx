import React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField as BaseFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { shouldShowField } from "../../schema/conditional.utils";
import {
  getFormInputType,
  type FormComponentProps,
  type FormFieldMetadata,
  type FormSection,
  getFormSections,
  getFormComponentType,
  buildFormProps,
  formRegistrySystem,
  groupFieldsBySection,
  getOrderedSections,
  DEFAULT_SECTION_ID,
} from "./form.registry";
import { SelectField } from "./fields/SelectField";
import { BooleanField } from "./fields/BooleanField";
import { NumberField } from "./fields/NumberField";
import { DateField } from "./fields/DateField";
import { TextField } from "./fields/TextField";
/**
 * Enhanced form field renderer using the new registry system
 */
export const FormFieldRenderer = ({ 
  schema, 
  fieldName, 
  metadata, 
  value, 
  onChange, 
  error, 
  className,
  form,
  mode = "create"
}: FormComponentProps) => {
  const fieldType = getFormInputType(schema, metadata);
  const props = { schema, fieldName, metadata, value, onChange, error, className, form, mode };
  
  switch (fieldType) {
    case "text":
    case "email":
    case "password":
    case "number":
      return <NumberField {...props} />;
    case "url":
    case "textarea":
      return <TextField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "boolean":
      return <BooleanField {...props} />;
    case "date":
      return <DateField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

/**
 * Form field using shadcn form components with conditional display
 */
export const FormField = ({
  schema,
  fieldName,
  control,
  watch,
  form,
}: {
  schema: z.ZodTypeAny;
  fieldName: string;
  control: any;
  watch: any;
  form: any;
}) => {
  const parentSchema = form.schema || schema;
  const metadata = getFieldMetadata(parentSchema, fieldName);

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
    <BaseFormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{metadata.label}</FormLabel>
          <FormControl>
            <FormFieldRenderer
              schema={schema}
              fieldName={fieldName}
              metadata={metadata}
              value={field.value}
              onChange={(_: string, value: unknown) => field.onChange(value)}
              form={form}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

/**
 * Section component for grouped form fields
 */
export const FormSectionComponent = ({
  section,
  children,
  isFirst = false,
}: {
  section: FormSection;
  children: React.ReactNode;
  isFirst?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(!section.collapsible);

  if (section.collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`${!isFirst ? 'pt-6 border-t border-gray-200' : ''}`}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-3 -mx-3 rounded-md mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {section.icon && (
                      <div className="text-gray-600 dark:text-gray-400 [&>svg]:h-5 [&>svg]:w-5">
                        {section.icon}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4">
              {children}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={`${!isFirst ? 'pt-6 border-t border-gray-200' : ''}`}>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {section.icon && (
            <div className="text-gray-600 dark:text-gray-400 [&>svg]:h-5 [&>svg]:w-5">
              {section.icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
        </div>
        {section.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Complete form component using shadcn form components with automatic section support
 */
export const SchemaForm = ({
  schema,
  onSubmit,
  className,
  children,
}: {
  schema: z.ZodObject<any>;
  onSubmit: (data: Record<string, any>) => void;
  className?: string;
  children?: React.ReactNode;
}) => {
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  // Get schema shape and sections
  const schemaShape = schema.shape;
  const sections = getFormSections(schema);
  
  // If no sections are registered, render simple form
  if (!sections) {
    const fieldNames = Object.keys(schemaShape);
    return (
      <div className={`max-w-md mx-auto ${className || ""}`}>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {fieldNames.map((fieldName) => (
              <FormField
                key={fieldName}
                schema={schemaShape[fieldName] as z.ZodType}
                fieldName={fieldName}
                control={form.control}
                watch={form.watch}
                form={form}
              />
            ))}
            <Button type="submit" className="w-full">
              Submit
            </Button>
            {children}
          </form>
        </Form>
      </div>
    );
  }

  // Get field metadata from the new registry system
  const fieldsMetadata = getFormFields(schema) || {};
  
  // Group fields by section
  const fieldsBySection = groupFieldsBySection(fieldsMetadata, sections);
  const orderedSections = getOrderedSections(sections, Object.keys(fieldsBySection));

  return (
    <div className={`max-w-2xl mx-auto ${className || ""}`}>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {orderedSections.map(({ id: sectionId, section }, index) => {
            const sectionFields = fieldsBySection[sectionId] || [];
            
            if (sectionFields.length === 0) {
              return null;
            }

            return (
              <FormSectionComponent
                key={sectionId}
                section={section}
                isFirst={index === 0}
              >
                {sectionFields.map((fieldName) => (
                  <FormField
                    key={fieldName}
                    schema={schemaShape[fieldName] as z.ZodType}
                    fieldName={fieldName}
                    control={form.control}
                    watch={form.watch}
                    form={form}
                  />
                ))}
              </FormSectionComponent>
            );
          })}
          
          <div className="flex justify-center pt-6">
            <Button type="submit" className="w-full max-w-md">
              Submit
            </Button>
          </div>
          {children}
        </form>
      </Form>
    </div>
  );
};
