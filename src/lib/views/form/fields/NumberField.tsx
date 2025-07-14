"use client";

import { Input } from "../../../../components/ui/input";
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

interface NumberFieldProps<T extends FieldValues = FieldValues>
  extends FormComponentProps<T> {
  // Additional number-specific props can go here
}

// =============================================================================
// NUMBER FIELD COMPONENT
// =============================================================================

export function NumberField<T extends FieldValues = FieldValues>({
  fieldName,
  metadata,
  value,
  onChange,
  form,
  mode,
  className,
}: NumberFieldProps<T>) {
  const {
    min,
    max,
    step,
    placeholder,
    description,
    disabled,
    required,
  } = metadata;

  const isDisabled = disabled || mode === "view";

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
            {metadata.label}
          </FormLabel>
          
          <FormControl>
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              disabled={isDisabled}
              className={cn(className)}
              value={value as string || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  onChange(fieldName, undefined);
                } else {
                  const numericValue = parseFloat(value);
                  if (!isNaN(numericValue)) {
                    onChange(fieldName, numericValue);
                  }
                }
              }}
            />
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