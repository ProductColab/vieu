"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../../../components/ui/button";
import { SimpleCalendar } from "../../../../components/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../../../components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import { cn } from "../../../../lib/utils";
import type { FieldComponentProps } from "../form.types";
import type { FieldValues, Path } from "react-hook-form";

// =============================================================================
// TYPES
// =============================================================================

interface DateFieldProps<T extends FieldValues = FieldValues>
  extends FieldComponentProps<T, Path<T>> {
  field: FieldComponentProps<T, Path<T>>["field"] & {
    type: "date";
  };
}

// =============================================================================
// DATE FIELD COMPONENT
// =============================================================================

export function DateField<T extends FieldValues = FieldValues>({
  field,
  form,
  mode,
  className,
}: DateFieldProps<T>) {
  const {
    id,
    label,
    options = {},
  } = field;

  const {
    placeholder = "Pick a date",
    description,
    disabled,
    required,
    disabledDates,
    className: fieldClassName,
  } = options as any;

  const isDisabled = disabled || mode === "view";

  return (
    <FormField
      control={form.control}
      name={id}
      render={({ field: formField }) => (
        <FormItem className={cn("flex flex-col space-y-2", className)}>
          <FormLabel className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </FormLabel>
          
          <FormControl>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !formField.value && "text-muted-foreground",
                    fieldClassName
                  )}
                  disabled={isDisabled}
                >
                  {formField.value ? (
                    format(new Date(formField.value), "PPP")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <SimpleCalendar
                  mode="single"
                  selected={formField.value ? new Date(formField.value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      formField.onChange(format(date, "yyyy-MM-dd"));
                    }
                  }}
                  disabled={(date: Date) => {
                    if (isDisabled) return true;
                    if (disabledDates && typeof disabledDates === 'function') {
                      return disabledDates(date);
                    }
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

export default DateField; 