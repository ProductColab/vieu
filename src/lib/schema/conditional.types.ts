/**
 * Conditional display logic for fields
 */
export type ConditionalDisplay =
  | {
      field: string;
      condition:
        | "equals"
        | "not_equals"
        | "contains"
        | "greater_than"
        | "less_than";
      value: any;
    }
  | {
      field: string;
      condition: "custom";
      predicate: (fieldValue: any, allValues: Record<string, any>) => boolean;
    };

/**
 * Cross-field validation rule
 */
export type CrossFieldValidation = {
  /** Error message when validation fails */
  message: string;
  /** Which field(s) to attach the error to */
  path?: string[];
  /** Validation function that receives all form values */
  validate: (values: Record<string, any>) => boolean;
};
