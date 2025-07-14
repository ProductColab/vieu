import React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import { Form } from "../../../components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getFormSections,
  groupFieldsBySection,
  getOrderedSections,
} from "./form.registry";
import { formRegistrySystem, EnhancedFormField } from "./renderer";

/**
 * Section component for grouped form fields
 */
export const FormSectionComponent = ({
  section,
  children,
  isFirst = false,
}: {
  section: {
    title: string;
    description?: string;
    collapsible?: boolean;
    icon?: React.ReactElement;
  };
  children: React.ReactNode;
  isFirst?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(!section.collapsible);

  if (section.collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`${!isFirst ? "pt-6 border-t border-gray-200" : ""}`}>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h3>
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
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
            <div className="space-y-4">{children}</div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={`${!isFirst ? "pt-6 border-t border-gray-200" : ""}`}>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {section.icon && (
            <div className="text-gray-600 dark:text-gray-400 [&>svg]:h-5 [&>svg]:w-5">
              {section.icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {section.title}
          </h3>
        </div>
        {section.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {section.description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
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
  const fieldsMetadata: Record<string, { form?: any }> = {};
  Object.entries(schemaShape).forEach(([fieldName, fieldSchema]) => {
    const metadata = formRegistrySystem.get(fieldSchema as z.ZodType);
    if (metadata) {
      fieldsMetadata[fieldName] = { form: metadata };
    }
  });

  // Group fields by section
  const fieldsBySection = groupFieldsBySection(fieldsMetadata, sections);
  const orderedSections = getOrderedSections(
    sections,
    Object.keys(fieldsBySection)
  );

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

// Re-export components from renderer for backwards compatibility
export {
  formRegistrySystem,
  FormFieldRenderer,
  EnhancedFormField,
} from "./renderer";

// Re-export the form registry
export { formRegistry, getComponentFromSchema } from "./renderer";
