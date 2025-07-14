"use client";

import { useMemo, useState, useCallback } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { FieldComponentProps, AsyncSelectFieldOptions } from "../form.types";
import type { FieldValues, Path, PathValue } from "react-hook-form";

// =============================================================================
// TYPES
// =============================================================================

interface AsyncSelectFieldProps<
  T extends FieldValues = FieldValues,
  K extends Path<T> = Path<T>
> extends FieldComponentProps<T, K> {
  field: FieldComponentProps<T, K>["field"] & {
    type: "asyncselect";
    options: AsyncSelectFieldOptions<T, K>;
  };
}

// =============================================================================
// ASYNC SELECT FIELD COMPONENT
// =============================================================================

export function SelectorField<
  T extends FieldValues = FieldValues,
  K extends Path<T> = Path<T>
>({
  field,
  form,
  mode,
  className,
}: AsyncSelectFieldProps<T, K>) {
  const {
    id,
    label,
    options,
  } = field;

  const {
    query,
    valueField = "id",
    labelField = "name",
    secondaryTextField,
    getSecondaryText,
    icon: IconComponent,
    searchable = false,
    clearable = false,
    multiple = false,
    placeholder,
    description,
    disabled,
    required,
    onSearch,
    className: fieldClassName,
  } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isDisabled = disabled || mode === "view";
  const isLoading = query.isLoading || query.isFetching;

  // Extract data from query result - handle both direct array and paginated response
  const rawData = useMemo(() => {
    if (!query.data) return [];
    
    // Handle paginated response with data property
    if (Array.isArray(query.data)) {
      return query.data;
    }
    
    // Handle direct array response
    if (query.data && typeof query.data === 'object' && 'data' in query.data) {
      return (query.data as { data: Record<string, unknown>[] }).data || [];
    }
    
    return [];
  }, [query.data]);

  // Filter and map data
  const processedData = useMemo(() => {
    let filtered = rawData;
    
    // Apply search filter if search term exists
    if (searchTerm && searchable) {
      filtered = rawData.filter((item: Record<string, unknown>) => {
        const label = item[labelField]?.toString().toLowerCase() || "";
        const secondaryText = secondaryTextField ? item[secondaryTextField]?.toString().toLowerCase() : "";
        return label.includes(searchTerm.toLowerCase()) || 
               (secondaryText && secondaryText.includes(searchTerm.toLowerCase()));
      });
    }
    
    // Map to standardized format
    return filtered.map((item: Record<string, unknown>) => {
      let secondaryText: string | null = null;
      
      // Generate secondary text using function if provided
      if (getSecondaryText) {
        secondaryText = getSecondaryText(item as any);
      }
      // Otherwise use field name if provided
      else if (secondaryTextField && item[secondaryTextField]) {
        secondaryText = item[secondaryTextField]?.toString() || null;
      }
      
      return {
        value: item[valueField] as string,
        label: item[labelField]?.toString() || "",
        secondaryText,
        originalItem: item,
      };
    });
  }, [rawData, searchTerm, searchable, labelField, valueField, secondaryTextField, getSecondaryText]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  }, [onSearch]);

  // Handle value selection
  const handleValueChange = useCallback((value: string | string[]) => {
    const fieldValue = form.getValues(id);
    
    if (multiple) {
      // Handle multiple selection
      if (typeof value === "string") {
        const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
        const newValues = currentValues.includes(value as never)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        form.setValue(id, newValues as PathValue<T, K>);
      }
    } else {
      // Handle single selection
      form.setValue(id, value as PathValue<T, K>);
      setIsOpen(false);
    }
  }, [form, id, multiple]);

  // Handle clear selection
  const handleClear = useCallback(() => {
    form.setValue(id, (multiple ? [] : "") as PathValue<T, K>);
  }, [form, id, multiple]);

  return (
    <FormField
      control={form.control}
      name={id}
      render={({ field: formField }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </FormLabel>
          
          <FormControl>
            <div className={cn("relative", fieldClassName)}>
              <Select
                open={isOpen}
                onOpenChange={setIsOpen}
                value={multiple ? undefined : formField.value}
                onValueChange={handleValueChange}
                disabled={isDisabled}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  isLoading && "pr-10"
                )}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <SelectValue placeholder={placeholder} />
                    </div>
                  </div>
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Clear button */}
                  {clearable && formField.value && !isDisabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 hover:bg-muted rounded-sm p-1"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </SelectTrigger>
                
                <SelectContent>
                  {/* Search input */}
                  {searchable && (
                    <div className="flex items-center border-b p-2">
                      <Search className="h-4 w-4 text-muted-foreground mr-2" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="border-0 p-0 h-auto focus-visible:ring-0"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {/* Loading state */}
                  {isLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  )}
                  
                  {/* Error state */}
                  {query.error && (
                    <div className="p-4 text-sm text-destructive">
                      Error loading data: {query.error.message}
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {!isLoading && !query.error && processedData.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      {searchTerm ? "No results found" : "No data available"}
                    </div>
                  )}
                  
                  {/* Options */}
                  {!isLoading && !query.error && processedData.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className={cn(
                        "cursor-pointer",
                        multiple && Array.isArray(formField.value) && formField.value.includes(item.value) &&
                        "bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="font-medium text-sm">{item.label}</div>
                          {item.secondaryText && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.secondaryText}
                            </div>
                          )}
                        </div>
                        {multiple && Array.isArray(formField.value) && formField.value.includes(item.value) && (
                          <div className="h-2 w-2 bg-primary rounded-full ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

export default SelectorField; 