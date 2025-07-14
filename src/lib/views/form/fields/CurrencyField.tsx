"use client";

import { useState, useEffect, useCallback } from "react";
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

interface CurrencyFieldProps<T extends FieldValues = FieldValues>
  extends FormComponentProps<T> {
  // Additional currency-specific props can go here
}

// =============================================================================
// CURRENCY FIELD COMPONENT
// =============================================================================

export function CurrencyField<T extends FieldValues = FieldValues>({
  fieldName,
  metadata,
  form,
  mode,
  className
}: CurrencyFieldProps<T>) {
  const {
    currency = "USD",
    locale = "en-US",
    precision = 2,
    min,
    max,  
    step = 0.01,
    allowNegative = false,
    placeholder,
    description,
    disabled,
    required,
  } = metadata;

  const isDisabled = disabled || mode === "view";
  
  // State for managing display value vs actual value
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Currency formatter
  const formatCurrency = useCallback((value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }
    
    const numValue = typeof value === 'number' ? value : Number(value);
    
    if (isNaN(numValue)) {
      return "";
    }
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(numValue);
    } catch (error) {
      // Fallback if locale/currency is invalid
      return `${currency} ${numValue.toFixed(precision)}`;
    }
  }, [currency, locale, precision]);

  // Parse currency string to number
  const parseCurrency = useCallback((value: string): number | null => {
    if (!value || value.trim() === "") {
      return null;
    }
    
    // Remove currency symbols, spaces, and non-numeric characters except decimal and minus
    const cleaned = value
      .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus
      .replace(/\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^-+/, '-') // Keep only first minus sign
      .replace(/-+$/, ''); // Remove trailing minus signs
    
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      return null;
    }
    
    // Apply precision
    return Math.round(parsed * Math.pow(10, precision || 0)) / Math.pow(10, precision || 0);
  }, [precision]);

  // Update display value when form value changes
  useEffect(() => {
    const formValue = form.getValues(fieldName as Path<T>);
    if (!isFocused) {
      setDisplayValue(formatCurrency(formValue));
    }
  }, [form, fieldName, formatCurrency, isFocused]);

  // Handle input change - this will be recreated inside render to access formField
  const createInputChangeHandler = useCallback((formFieldOnChange: (value: any) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      const numericValue = parseCurrency(inputValue);
      
      // Apply validation
      if (numericValue !== null) {
        // Check negative values
        if (!allowNegative && numericValue < 0) {
          return;
        }
        
        // Check min/max
        if (min !== undefined && numericValue < min) {
          return;
        }
        if (max !== undefined && numericValue > max) {
          return;
        }
      }
      
      // Update form value using the properly typed onChange
      formFieldOnChange(numericValue);
    };
  }, [parseCurrency, allowNegative, min, max]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw numeric value when focused
    const formValue = form.getValues(fieldName as Path<T>);
    if (formValue !== null && formValue !== undefined) {
      setDisplayValue(String(formValue));
    }
  }, [form, fieldName]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Format as currency when not focused
    const formValue = form.getValues(fieldName as Path<T>);
    setDisplayValue(formatCurrency(formValue));
  }, [form, fieldName, formatCurrency]);

  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={({ field: formField }) => {
        // Handle step up/down - defined inside render to access formField
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const currentValue = parseCurrency(displayValue);
            const currentNum = typeof currentValue === 'number' ? currentValue : 0;
            const newValue = e.key === 'ArrowUp' ? currentNum + step : currentNum - step;
            
            // Apply validation
            if (!allowNegative && newValue < 0) return;
            if (min !== undefined && newValue < min) return;
            if (max !== undefined && newValue > max) return;
            
            const formattedValue = Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision);
            formField.onChange(formattedValue);
            setDisplayValue(formattedValue.toString());
          }
        };

        return (
          <FormItem className={cn("space-y-2", className)}>
            <FormLabel className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}>
              {metadata.label}
            </FormLabel>
            
            <FormControl>
              <div className="relative">
                <Input
                  type="text"
                  value={displayValue}
                  onChange={createInputChangeHandler(formField.onChange)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder || formatCurrency(0)}
                  disabled={isDisabled}
                  className={cn(
                    "text-right", // Right align for currency
                    className
                  )}
                  autoComplete="off"
                />
                {!isFocused && (
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground text-sm">
                      {currency}
                    </span>
                  </div>
                )}
              </div>
            </FormControl>
            
            {description && (
              <FormDescription className="text-xs text-muted-foreground">
                {description}
              </FormDescription>
            )}
            
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default CurrencyField; 