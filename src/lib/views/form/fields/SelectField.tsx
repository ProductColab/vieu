"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { getOptionsFromSchema, type ViewOption } from "../../../schema";
import { useSchemaOptions } from "../../../schema/options-query";
import { type FormComponentProps } from "../form.registry";

/**
 * Select component renderer with async options support
 */
export const renderSelectComponent = (props: FormComponentProps) => {
  // Get static options from schema (enums, unions, etc.)
  const staticOptions = getOptionsFromSchema(props.schema);

  // Use the async options hook which handles both static and async cases
  const { options, isLoading, error } = useSchemaOptions(
    props.schema,
    staticOptions
  );

  // Show loading state
  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={props.className}>
          <SelectValue placeholder="Loading options..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>
            Loading options...
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // Show error state
  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className={props.className}>
          <SelectValue placeholder="Error loading options" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="error" disabled>
            Error: {error.message}
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // Render normal select with options
  return (
    <Select
      value={(props.value as string) || ""}
      onValueChange={(value) => props.onChange(props.fieldName, value)}
      disabled={isLoading}
    >
      <SelectTrigger className={props.className}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt: ViewOption) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
