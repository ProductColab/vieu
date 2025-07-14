"use client";

import { Textarea } from "../../../../components/ui/textarea";
import { safeToJSONSchema } from "../../../schema";
import { type FormComponentProps } from "../form.registry";

/**
 * Textarea component renderer
 */
export const renderTextareaComponent = (props: FormComponentProps) => {
  const jsonSchema = safeToJSONSchema(props.schema);

  return (
    <Textarea
      value={(props.value as string) || ""}
      onChange={(e) => props.onChange(props.fieldName, e.target.value)}
      placeholder={props.metadata.placeholder}
      className={props.className}
      rows={props.metadata.rows || 4}
      minLength={jsonSchema?.minLength}
      maxLength={jsonSchema?.maxLength}
    />
  );
};
