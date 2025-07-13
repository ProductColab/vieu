import React from "react";
import * as z from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  createSchemaFieldRenderer,
  iterateSchemaShape,
  createViewRegistry,
} from "../../schema";
import { shouldShowFieldInView } from "../../schema/conditional.utils";
import {
  getTableComponentType,
  buildTableProps,
  type TableColumnMetadata,
  type TableComponentProps,
} from "./table.registry";

/**
 * Badge component for table cells
 */
const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "blue";
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};

/**
 * Individual table cell renderers using JSX
 */
export const TextCell = ({ props }: { props: TableComponentProps }) => {
  const displayValue = String(props.value || "");
  const alignClass =
    props.metadata.align === "center"
      ? "text-center"
      : props.metadata.align === "right"
      ? "text-right"
      : "text-left";

  return (
    <TableCell
      className={`${alignClass} ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      {displayValue}
    </TableCell>
  );
};

export const NumberCell = ({ props }: { props: TableComponentProps }) => {
  const displayValue =
    typeof props.value === "number"
      ? props.value.toLocaleString()
      : String(props.value || "");
  const alignClass =
    props.metadata.align === "center"
      ? "text-center"
      : props.metadata.align === "left"
      ? "text-left"
      : "text-right";

  return (
    <TableCell
      className={`${alignClass} font-mono ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      {displayValue}
    </TableCell>
  );
};

export const BooleanCell = ({ props }: { props: TableComponentProps }) => {
  const isTrue = props.value === true || props.value === "true";
  const alignClass =
    props.metadata.align === "left"
      ? "text-left"
      : props.metadata.align === "right"
      ? "text-right"
      : "text-center";

  return (
    <TableCell
      className={`${alignClass} ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      <Badge variant={isTrue ? "success" : "default"}>
        {isTrue ? "Yes" : "No"}
      </Badge>
    </TableCell>
  );
};

export const BadgeCell = ({ props }: { props: TableComponentProps }) => {
  const displayValue = String(props.value || "");
  const alignClass =
    props.metadata.align === "left"
      ? "text-left"
      : props.metadata.align === "right"
      ? "text-right"
      : "text-center";

  return (
    <TableCell
      className={`${alignClass} ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      <Badge variant="blue">{displayValue}</Badge>
    </TableCell>
  );
};

export const LinkCell = ({ props }: { props: TableComponentProps }) => {
  const displayValue = String(props.value || "");
  const href =
    props.metadata.displayType === "email"
      ? `mailto:${displayValue}`
      : displayValue;
  const alignClass =
    props.metadata.align === "center"
      ? "text-center"
      : props.metadata.align === "right"
      ? "text-right"
      : "text-left";

  return (
    <TableCell
      className={`${alignClass} ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={props.metadata.displayType === "url" ? "_blank" : undefined}
        rel={
          props.metadata.displayType === "url"
            ? "noopener noreferrer"
            : undefined
        }
      >
        {displayValue}
      </a>
    </TableCell>
  );
};

export const DateCell = ({ props }: { props: TableComponentProps }) => {
  const date =
    props.value instanceof Date ? props.value : new Date(String(props.value));
  const displayValue = isNaN(date.getTime())
    ? String(props.value)
    : date.toLocaleDateString();
  const alignClass =
    props.metadata.align === "center"
      ? "text-center"
      : props.metadata.align === "right"
      ? "text-right"
      : "text-left";

  return (
    <TableCell
      className={`${alignClass} ${props.className || ""}`}
      style={props.metadata.width ? { width: props.metadata.width } : undefined}
    >
      {displayValue}
    </TableCell>
  );
};

/**
 * Updated component map with JSX renderers
 */
export const jsxTableComponentMap = {
  "text-cell": (props: TableComponentProps) => <TextCell props={props} />,
  "number-cell": (props: TableComponentProps) => <NumberCell props={props} />,
  "boolean-cell": (props: TableComponentProps) => <BooleanCell props={props} />,
  "badge-cell": (props: TableComponentProps) => <BadgeCell props={props} />,
  "link-cell": (props: TableComponentProps) => <LinkCell props={props} />,
  "date-cell": (props: TableComponentProps) => <DateCell props={props} />,
};

/**
 * Create JSX-based registry system
 */
const jsxTableRegistrySystem = createViewRegistry(
  jsxTableComponentMap,
  getTableComponentType,
  buildTableProps
);

/**
 * Table-specific cell renderer that returns TableCell components directly
 * (no wrapper divs like the generic createSchemaFieldRenderer)
 */
export const TableCellRenderer = ({
  schema,
  fieldName,
  value,
  rowData,
  sortDirection,
  onSort,
  className,
}: {
  schema: z.ZodType;
  fieldName: string;
  value: unknown;
  rowData?: Record<string, unknown>;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (fieldName: string) => void;
  className?: string;
}) => {
  const metadata = jsxTableRegistrySystem.get(schema);

  if (!metadata) {
    // Return empty TableCell instead of error div to maintain table structure
    return (
      <TableCell className="text-red-500 text-sm">
        No table metadata for: {fieldName}
      </TableCell>
    );
  }

  // Use the table registry render function directly
  return jsxTableRegistrySystem.render(
    schema,
    metadata,
    value,
    fieldName,
    className,
    { rowData, sortDirection, onSort }
  );
};

/**
 * Table header component using shadcn components
 */
export const SchemaTableHeader = ({
  schema,
  onSort,
  sortField,
  sortDirection,
  data,
}: {
  schema: z.ZodType;
  onSort?: (fieldName: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  data?: Record<string, unknown>[]; // Optional data to check if any row would show this column
}) => {
  const headers = iterateSchemaShape(schema, (fieldName, fieldSchema) => {
    const metadata = jsxTableRegistrySystem.get(
      fieldSchema
    ) as TableColumnMetadata;

    if (!metadata) {
      return (
        <TableHead key={fieldName} className="text-destructive">
          No metadata: {fieldName}
        </TableHead>
      );
    }

    // Check if any row would show this column (for conditional display)
    if (metadata.showWhen && data && data.length > 0) {
      const anyRowShows = data.some((rowData) =>
        shouldShowFieldInView(metadata.showWhen!, rowData)
      );
      if (!anyRowShows) {
        return <TableHead key={fieldName} className="w-0 p-0" />; // Hidden header maintains table structure
      }
    }

    const canSort = metadata.sortable && onSort;
    const isActiveSort = sortField === fieldName;

    return (
      <TableHead
        key={fieldName}
        className={`font-medium ${
          canSort ? "cursor-pointer hover:bg-muted/50" : ""
        }`}
        onClick={canSort ? () => onSort(fieldName) : undefined}
        style={metadata.width ? { width: metadata.width } : undefined}
      >
        <div className="flex items-center space-x-1">
          <span>{metadata.label}</span>
          {canSort && (
            <span className="text-muted-foreground">
              {isActiveSort ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
            </span>
          )}
        </div>
      </TableHead>
    );
  });

  return (
    <TableHeader>
      <TableRow>{headers}</TableRow>
    </TableHeader>
  );
};

/**
 * Table row component using shadcn components
 */
export const SchemaTableRow = ({
  schema,
  rowData,
  onSort,
  sortField,
  sortDirection,
}: {
  schema: z.ZodType;
  rowData: Record<string, unknown>;
  onSort?: (fieldName: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}) => {
  const cells = iterateSchemaShape(schema, (fieldName, fieldSchema) => {
    const metadata = jsxTableRegistrySystem.get(
      fieldSchema
    ) as TableColumnMetadata;

    // Check conditional display logic
    if (metadata?.showWhen) {
      const shouldShow = shouldShowFieldInView(metadata.showWhen, rowData);
      if (!shouldShow) {
        return <TableCell key={fieldName} className="w-0 p-0" />; // Hidden cell maintains table structure
      }
    }

    return (
      <TableCellRenderer
        key={fieldName}
        schema={fieldSchema}
        fieldName={fieldName}
        value={rowData[fieldName]}
        rowData={rowData}
        sortDirection={sortField === fieldName ? sortDirection : null}
        onSort={onSort}
      />
    );
  });

  return <TableRow className="hover:bg-muted/50">{cells}</TableRow>;
};

/**
 * Complete table component using shadcn components
 */
export const SchemaTable = ({
  schema,
  data,
  sortField,
  sortDirection,
  onSort,
  className,
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (fieldName: string) => void;
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={className}>
      <Table>
        <SchemaTableHeader
          schema={schema}
          onSort={onSort}
          sortField={sortField}
          sortDirection={sortDirection}
          data={data}
        />
        <TableBody>
          {data.map((rowData, index) => (
            <SchemaTableRow
              key={index}
              schema={schema}
              rowData={rowData}
              onSort={onSort}
              sortField={sortField}
              sortDirection={sortDirection}
            />
          ))}
        </TableBody>
      </Table>
      {children}
    </div>
  );
};

/**
 * Hook for table sorting
 */
export function useTableSort(
  initialField?: string,
  initialDirection: "asc" | "desc" = "asc"
) {
  const [sortField, setSortField] = React.useState<string | undefined>(
    initialField
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    initialDirection
  );

  const handleSort = React.useCallback(
    (fieldName: string) => {
      if (sortField === fieldName) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(fieldName);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const sortData = React.useCallback(
    (data: Record<string, unknown>[]) => {
      if (!sortField) return data;

      return [...data].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
    [sortField, sortDirection]
  );

  return {
    sortField,
    sortDirection,
    handleSort,
    sortData,
  };
}

/**
 * Export registry system for backward compatibility
 */
export const tableRegistry = jsxTableRegistrySystem.registry;
export const getTableComponentFromSchema = jsxTableRegistrySystem.render;
