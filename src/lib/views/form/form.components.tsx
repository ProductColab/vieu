import React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  createSchemaFieldRenderer,
  safeToJSONSchema,
  getOptionsFromSchema,
  type ViewOption,
} from "../../schema";
import { shouldShowField } from "../../schema/conditional.utils";
import {
  getInputType,
  type FormComponentProps,
  type FormFieldMetadata,
  getFormComponentType,
  buildFormProps,
  createViewRegistry,
  type ComponentMap,
  getFormSections,
  groupFieldsBySection,
  getOrderedSections,
} from "./form.registry";

/**
 * Input component renderer for text, email, number, etc.
 */
export const renderInputComponent = (props: FormComponentProps) => {
  const inputType = getInputType(props.schema, props.metadata);
  const jsonSchema = safeToJSONSchema(props.schema);

  // Convert value based on input type to ensure controlled inputs
  let displayValue: string | number = "";

  if (props.value != null) {
    if (inputType === "number") {
      // For number inputs, keep as number if it's already a number, otherwise convert
      displayValue =
        typeof props.value === "number" ? props.value : String(props.value);
    } else {
      // For text, email, etc. - always convert to string
      displayValue = String(props.value);
    }
  } else {
    // For undefined/null values, use empty string
    displayValue = "";
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Convert back to appropriate type before calling onChange
    if (inputType === "number") {
      // For number inputs, convert to number if valid, otherwise pass the string
      const numValue = Number(newValue);
      props.onChange(props.fieldName, isNaN(numValue) ? newValue : numValue);
    } else {
      props.onChange(props.fieldName, newValue);
    }
  };

  return (
    <Input
      type={inputType}
      value={displayValue}
      onChange={handleChange}
      placeholder={props.metadata.placeholder}
      className={props.className}
      min={jsonSchema?.minimum}
      max={jsonSchema?.maximum}
      minLength={jsonSchema?.minLength}
      maxLength={jsonSchema?.maxLength}
    />
  );
};

/**
 * Textarea component renderer
 */
export const renderTextareaComponent = (props: FormComponentProps) => {
  const jsonSchema = safeToJSONSchema(props.schema);

  return (
    <Textarea
      value={(props.value as string) || ""}
      onChange={(e) => props.onChange(props.fieldName, e.target.value)}
      placeholder={props.metadata.placeholder}
      className={props.className}
      rows={props.metadata.rows || 4}
      minLength={jsonSchema?.minLength}
      maxLength={jsonSchema?.maxLength}
    />
  );
};

/**
 * Select component renderer
 */
export const renderSelectComponent = (props: FormComponentProps) => {
  const options = getOptionsFromSchema(props.schema);

  return (
    <Select
      value={(props.value as string) || ""}
      onValueChange={(value) => props.onChange(props.fieldName, value)}
    >
      <SelectTrigger className={props.className}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options?.map((opt: ViewOption) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/**
 * Checkbox component renderer
 */
export const renderCheckboxComponent = (props: FormComponentProps) => {
  return (
    <Checkbox
      checked={props.value === "true" || props.value === true || false}
      onCheckedChange={(checked) => props.onChange(props.fieldName, checked)}
      className={props.className}
    />
  );
};

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
const formRegistrySystem = createViewRegistry(
  formComponentMap,
  getFormComponentType,
  buildFormProps
);

/**
 * The complete form registry system
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
 * Section component for grouped form fields
 */
export const FormSectionComponent = ({
  section,
  children,
  isFirst = false,
}: {
  section: { title: string; description?: string; collapsible?: boolean };
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
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
              <EnhancedFormField
                key={fieldName}
                schema={schemaShape[fieldName] as z.ZodType}
                fieldName={fieldName}
                control={form.control}
                watch={form.watch}
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

  // Get field metadata for grouping
  const fieldsMetadata: Record<string, { form?: FormFieldMetadata }> = {};
  Object.entries(schemaShape).forEach(([fieldName, fieldSchema]) => {
    const metadata = formRegistrySystem.get(fieldSchema as z.ZodType);
    if (metadata) {
      fieldsMetadata[fieldName] = { form: metadata };
    }
  });

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
                  <EnhancedFormField
                    key={fieldName}
                    schema={schemaShape[fieldName] as z.ZodType}
                    fieldName={fieldName}
                    control={form.control}
                    watch={form.watch}
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
