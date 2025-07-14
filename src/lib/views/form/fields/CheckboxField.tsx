"use client";

import { Checkbox } from "../../../../components/ui/checkbox";
import { type FormComponentProps } from "../form.registry";

/**
 * Checkbox component renderer
 */
export const renderCheckboxComponent = (props: FormComponentProps) => {
  return (
    <Checkbox
      checked={props.value === "true" || props.value === true || false}
      onCheckedChange={(checked) => props.onChange(props.fieldName, checked)}
      className={props.className}
    />
  );
};
