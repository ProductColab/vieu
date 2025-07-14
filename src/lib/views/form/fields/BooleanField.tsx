"use client";

import { Checkbox } from "../../../../components/ui/checkbox";
import { Switch } from "../../../../components/ui/switch";
import { Label } from "../../../../components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "../../../../components/ui/form";
import { cn } from "../../../../lib/utils";
import type { FormComponentProps } from "../form.registry";
import type { FieldValues, Path } from "react-hook-form";

// =============================================================================
// TYPES
// =============================================================================

interface BooleanFieldProps<T extends FieldValues = FieldValues>
  extends FormComponentProps<T> {
  // Additional boolean-specific props can go here
}

// =============================================================================
// BOOLEAN FIELD COMPONENT
// =============================================================================

export function BooleanField<T extends FieldValues = FieldValues>({
  fieldName,
  metadata,
  value,
  onChange,
  form,
  mode,
  className,
}: BooleanFieldProps<T>) {
  const {
    booleanType = "checkbox",
    description,
    disabled,
    required,
  } = metadata;

  const isDisabled = disabled || mode === "view";

  const getSizeClasses = () => {
    switch (booleanType) {
      case "checkbox":
        return "h-3 w-3";
      case "switch":
        return "h-4 w-6";
      default:
        return "h-4 w-4";
    }
  };

  const renderControl = (checked: boolean, onChange: (checked: boolean) => void) => {
    const sizeClasses = getSizeClasses();
    
    if (booleanType === "switch") {
      return (
        <Switch
          id={fieldName}
          checked={checked}
          onCheckedChange={onChange}
          disabled={isDisabled}
          className={cn(sizeClasses, className)}
          aria-label={metadata.label}
        />
      );
    }
    
    return (
      <Checkbox
        id={fieldName}
        checked={checked}
        onCheckedChange={onChange}
        disabled={isDisabled}
        className={cn(sizeClasses, className)}
        aria-label={metadata.label}
      />
    );
  };

  const renderFieldContent = (checked: boolean, onChange: (checked: boolean) => void) => {
    const controlElement = renderControl(checked, onChange);
    
    const displayLabel = checked ? "Yes" : "No";
    
    if (booleanType === "checkbox") {
      return (
        <div className="flex items-center space-x-3">
          <Label 
            htmlFor={fieldName}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {displayLabel}
          </Label>
          {controlElement}
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-3">
        {controlElement}
        <Label 
          htmlFor={fieldName}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {displayLabel}
        </Label>
      </div>
    );
  };

  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={() => (
        <FormItem className={cn("space-y-2", className)}>
          <FormControl>
            {renderFieldContent(
              value as boolean || false,
              (checked: boolean) => onChange(fieldName, checked)
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

export default BooleanField; 