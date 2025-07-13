import * as z from "zod";
import {
  type BaseMetadata,
  type BaseComponentProps,
  type ComponentTypeMap,
  type PropsBuilder,
  getGenericInputType,
  createComponentTypeGetter,
  createViewRegistry,
} from "../../schema";
import type { ConditionalDisplay } from "../../schema/conditional.types";

/**
 * Table-specific metadata that extends base metadata with column-specific properties
 */
export interface TableColumnMetadata extends BaseMetadata {
  label: string;
  /** Column width as a CSS value (e.g., "100px", "20%", "auto") */
  width?: string;
  /** Whether this column can be sorted by the user */
  sortable?: boolean;
  /** Text alignment within the column cells */
  align?: "left" | "center" | "right";
  /** Override the display type for this column */
  displayType?:
    | "text"
    | "number"
    | "boolean"
    | "badge"
    | "link"
    | "date"
    | "email"
    | "url";
  showWhen?: ConditionalDisplay;
}

/**
 * Props passed to table cell components
 */
export type TableComponentProps = BaseComponentProps<TableColumnMetadata> & {
  /** The complete row data object containing all column values */
  rowData?: Record<string, unknown>;
  /** Current sort direction for this column, if any */
  sortDirection?: "asc" | "desc" | null;
  /** Callback function triggered when column header is clicked for sorting */
  onSort?: (fieldName: string) => void;
};

/**
 * Mapping from generic input types to table-specific cell component types
 */
export const tableComponentTypeMap: ComponentTypeMap = {
  text: "text-cell",
  email: "link-cell",
  number: "number-cell",
  url: "link-cell",
  select: "badge-cell",
  boolean: "boolean-cell",
  date: "date-cell",
};

/**
 * Determines the display type for a table column based on schema and metadata
 * @param schema - The Zod schema to analyze for type inference
 * @param metadata - Table column metadata that may contain explicit displayType
 * @returns The resolved display type string
 */
export const getTableDisplayType = (
  schema: z.ZodType,
  metadata: TableColumnMetadata
): string => {
  return getGenericInputType(schema, metadata.displayType);
};

/**
 * Factory-created function that determines the component type for table cells
 */
export const getTableComponentType =
  createComponentTypeGetter<TableColumnMetadata>(
    tableComponentTypeMap,
    (metadata) => metadata.displayType
  );

/**
 * Builds props object for table cell components
 * @param schema - The Zod schema for validation and type inference
 * @param metadata - Table column metadata
 * @param value - The cell value to display
 * @param fieldName - The field/column name
 * @param className - Optional additional CSS classes
 * @param rowData - Complete row data object
 * @param sortDirection - Current sort direction for this column
 * @param onSort - Sort handler function
 * @returns Complete table component props object
 */
export const buildTableProps: PropsBuilder<
  TableColumnMetadata,
  TableComponentProps
> = (
  schema: z.ZodType,
  metadata: TableColumnMetadata,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
): TableComponentProps => {
  const props = (extraProps as Record<string, unknown>) || {};

  return {
    schema,
    metadata,
    value,
    fieldName,
    className,
    rowData: props.rowData as Record<string, unknown>,
    sortDirection: props.sortDirection as "asc" | "desc" | null,
    onSort: props.onSort as (fieldName: string) => void,
  };
};

export { createViewRegistry };
