"use client";

import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../../../components/ui/form";
import { cn } from "../../../../lib/utils";
import type { FormComponentProps } from "../form.registry";
import type { FieldValues, Path } from "react-hook-form";

// =============================================================================
// TYPES
// =============================================================================

interface TextFieldProps<T extends FieldValues = FieldValues>
  extends FormComponentProps<T> {
  // Additional text-specific props can go here
}

// =============================================================================
// TEXT FIELD COMPONENT
// =============================================================================

export function TextField<T extends FieldValues = FieldValues>({
  fieldName,
  metadata,
  value,
  onChange,
  form,
  mode,
  className,
}: TextFieldProps<T>) {
  const {
    label,
    placeholder,
    description,
    disabled,
    required,
    minLength,
    maxLength,
    rows,
  } = metadata;

  const isDisabled = disabled || mode === "view";
  const inputType = metadata.fieldType || "text";
  const isTextarea = inputType === "textarea";

  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={() => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </FormLabel>
          
          <FormControl>
            {isTextarea ? (
              <Textarea
                placeholder={placeholder}
                disabled={isDisabled}
                className={cn(
                  "min-h-[80px] resize-none",
                  className
                )}
                rows={rows}
                value={value as string || ""}
                onChange={(e) => onChange(fieldName, e.target.value)}
              />
            ) : (
              <Input
                type={inputType}
                placeholder={placeholder}
                disabled={isDisabled}
                minLength={minLength}
                maxLength={maxLength}
                className={cn(className)}
                value={value as string || ""}
                onChange={(e) => onChange(fieldName, e.target.value)}
              />
            )}
          </FormControl>
          
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default TextField; 