"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
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

interface SelectFieldProps<T extends FieldValues = FieldValues>
  extends FormComponentProps<T> {
  // Additional select-specific props can go here
}

// =============================================================================
// SELECT FIELD COMPONENT
// =============================================================================

export function SelectField<T extends FieldValues = FieldValues>({
  fieldName,
  metadata,
  value,
  onChange,
  form,
  mode,
  className
}: SelectFieldProps<T>) {
  const {
    options: selectOptions = [],
    placeholder,
    description,
    disabled,
    required,
    clearable = false,
  } = metadata;

  const isDisabled = disabled || mode === "view";

  const renderSelectItem = (option: any) => {
    return (
      <SelectItem
        key={option.value}
        value={String(option.value)}
        disabled={option.disabled}
        className={cn(
          "flex items-center gap-2",
          option.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {option.icon && (
          <option.icon className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="flex flex-col">
          <span>{option.label || option.value}</span>
          {option.description && (
            <span className="text-xs text-muted-foreground">
              {option.description || option.value}
            </span>
          )}
        </div>
      </SelectItem>
    );
  };

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
            <Select
              value={value ? String(value) : undefined}
              onValueChange={(value) => {
                // Convert back to original type if needed
                const option = selectOptions.find((opt: any) => String(opt.value) === value);
                onChange(fieldName, option?.value || value);
              }}
              disabled={isDisabled}
            >
              <SelectTrigger className={cn(className)}>
                <SelectValue placeholder={placeholder || `Select ${metadata.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {/* Add empty option for clearable select */}
                {clearable && (
                  <SelectItem value="">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                )}
                
                {/* Options */}
                {selectOptions.length > 0 ? (
                  selectOptions.map(renderSelectItem)
                ) : (
                  <SelectItem value="" disabled>
                    <span className="text-muted-foreground">No options available</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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

export default SelectField; 