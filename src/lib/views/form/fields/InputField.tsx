"use client";

import { Input } from "../../../../components/ui/input";
import { safeToJSONSchema } from "../../../schema";
import { getInputType, type FormComponentProps } from "../form.registry";

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
