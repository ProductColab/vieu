import React from "react";
import * as z from "zod";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { createSchemaFieldRenderer, createViewRegistry } from "../../schema";
import { shouldShowFieldInView } from "../../schema/conditional.utils";
import {
  getDetailComponentType,
  buildDetailProps,
  type DetailFieldMetadata,
  type DetailComponentProps,
} from "./detail.registry";

/**
 * Detail text component - displays text content with rich formatting
 */
export const DetailText = ({ props }: { props: DetailComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const presentations = {
    default: "text-foreground",
    highlighted: "text-primary font-medium",
    bordered: "border-l-4 border-primary pl-4",
    card: "bg-muted/50 p-3 rounded-lg",
  };

  const baseClasses = `${textSizes[metadata.textSize || "base"]} ${
    presentations[metadata.presentation || "default"]
  } ${metadata.clickable ? "cursor-pointer hover:text-primary" : ""}`;

  return (
    <div
      className={baseClasses}
      onClick={
        metadata.clickable ? () => onClick?.(fieldName, value) : undefined
      }
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      {displayValue}
    </div>
  );
};

/**
 * Detail contact component - displays email/phone with proper links
 */
export const DetailContact = ({ props }: { props: DetailComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const isEmail = displayValue.includes("@");
  const href = isEmail ? `mailto:${displayValue}` : `tel:${displayValue}`;

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const presentations = {
    default: "text-blue-600 hover:text-blue-800",
    highlighted: "text-primary font-medium hover:text-primary/80",
    bordered:
      "border-l-4 border-blue-500 pl-4 text-blue-600 hover:text-blue-800",
    card: "bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100",
  };

  return (
    <a
      href={href}
      className={`${textSizes[metadata.textSize || "base"]} ${
        presentations[metadata.presentation || "default"]
      } hover:underline`}
      onClick={
        metadata.clickable ? () => onClick?.(fieldName, value) : undefined
      }
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      {displayValue}
    </a>
  );
};

/**
 * Detail badge component - displays status or tags as styled badges
 */
export const DetailBadge = ({ props }: { props: DetailComponentProps }) => {
  const { value, metadata } = props;
  const displayValue = String(value || "");

  if (!displayValue) return null;

  const presentations = {
    default: "",
    highlighted: "ring-2 ring-primary",
    bordered: "border-2 border-primary",
    card: "bg-card p-2 rounded-lg shadow-sm",
  };

  const badgeElement = (
    <Badge variant={metadata.badgeVariant || "default"}>
      {metadata.icon && <span className="mr-1">{metadata.icon}</span>}
      {displayValue}
    </Badge>
  );

  if (metadata.presentation === "card") {
    return <div className={presentations.card}>{badgeElement}</div>;
  }

  return (
    <div className={presentations[metadata.presentation || "default"]}>
      {badgeElement}
    </div>
  );
};

/**
 * Detail link component - displays URLs as styled links
 */
export const DetailLink = ({ props }: { props: DetailComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const presentations = {
    default: "text-blue-600 hover:text-blue-800",
    highlighted: "text-primary font-medium hover:text-primary/80",
    bordered:
      "border-l-4 border-blue-500 pl-4 text-blue-600 hover:text-blue-800",
    card: "bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100",
  };

  return (
    <a
      href={displayValue}
      target="_blank"
      rel="noopener noreferrer"
      className={`${textSizes[metadata.textSize || "base"]} ${
        presentations[metadata.presentation || "default"]
      } hover:underline`}
      onClick={
        metadata.clickable ? () => onClick?.(fieldName, value) : undefined
      }
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      {displayValue}
    </a>
  );
};

/**
 * Detail component map
 */
export const detailComponentMap = {
  "detail-text": (props: DetailComponentProps) => <DetailText props={props} />,
  "detail-contact": (props: DetailComponentProps) => (
    <DetailContact props={props} />
  ),
  "detail-badge": (props: DetailComponentProps) => (
    <DetailBadge props={props} />
  ),
  "detail-link": (props: DetailComponentProps) => <DetailLink props={props} />,
};

/**
 * Create detail registry system
 */
const detailRegistrySystem = createViewRegistry(
  detailComponentMap,
  getDetailComponentType,
  buildDetailProps
);

/**
 * Detail field renderer
 */
export const DetailFieldRenderer =
  createSchemaFieldRenderer(detailRegistrySystem);

/**
 * Export the raw registry for use in schema registration
 */
export const detailRegistry = detailRegistrySystem.registry;

/**
 * Detail field component with label and help text
 */
export const DetailField = ({
  schema,
  fieldName,
  value,
  itemData,
  onClick,
  onAction,
  className,
}: {
  schema: z.ZodType;
  fieldName: string;
  value: unknown;
  itemData?: Record<string, unknown>;
  onClick?: (fieldName: string, value: unknown) => void;
  onAction?: (
    action: string,
    fieldName: string,
    itemData: Record<string, unknown>
  ) => void;
  className?: string;
}) => {
  const metadata = detailRegistrySystem.get(schema) as DetailFieldMetadata;

  if (!metadata || metadata.showInDetail === false) {
    return null;
  }

  // Check conditional display logic
  if (metadata.showWhen && itemData) {
    const shouldShow = shouldShowFieldInView(metadata.showWhen, itemData);
    if (!shouldShow) return null;
  }

  const layoutClasses = {
    "full-width": "col-span-full",
    "half-width": "col-span-6",
    "third-width": "col-span-4",
  };

  const priorityClasses = {
    high: "order-1",
    medium: "order-2",
    low: "order-3",
  };

  return (
    <div
      className={`${layoutClasses[metadata.layout || "full-width"]} ${
        priorityClasses[metadata.priority || "medium"]
      } ${className || ""}`}
    >
      {metadata.showLabel !== false && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-foreground">
            {metadata.label}
          </label>
          {metadata.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <span className="text-xs">?</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-sm">{metadata.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <DetailFieldRenderer
        schema={schema}
        fieldName={fieldName}
        value={value}
        itemData={itemData}
        onClick={onClick}
        onAction={onAction}
      />
    </div>
  );
};

/**
 * Detail section component for grouping fields
 */
export const DetailSection = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-12 gap-4">{children}</div>
    </div>
  );
};

/**
 * Schema-driven detail component
 */
export const SchemaDetail = ({
  schema,
  data,
  onClick,
  onAction,
  className,
  layout = "single-column",
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>;
  onClick?: (fieldName: string, value: unknown) => void;
  onAction?: (
    action: string,
    fieldName: string,
    itemData: Record<string, unknown>
  ) => void;
  className?: string;
  layout?: "single-column" | "two-column" | "sidebar";
  children?: React.ReactNode;
}) => {
  const fieldsBySection: Record<string, React.ReactElement[]> = {
    default: [],
  };

  if ("shape" in schema) {
    const shape = schema.shape as Record<string, z.ZodType>;
    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      const metadata = detailRegistrySystem.get(
        fieldSchema
      ) as DetailFieldMetadata;

      if (!metadata || metadata.showInDetail === false) return;

      // Check conditional display logic
      if (metadata.showWhen) {
        const shouldShow = shouldShowFieldInView(metadata.showWhen, data);
        if (!shouldShow) return;
      }

      const element = (
        <DetailField
          key={fieldName}
          schema={fieldSchema}
          fieldName={fieldName}
          value={data[fieldName]}
          itemData={data}
          onClick={onClick}
          onAction={onAction}
        />
      );

      const section = metadata.section || "default";
      if (!fieldsBySection[section]) {
        fieldsBySection[section] = [];
      }
      fieldsBySection[section].push(element);
    });
  }

  const layoutClasses = {
    "single-column": "max-w-4xl mx-auto",
    "two-column": "max-w-7xl mx-auto",
    sidebar: "max-w-7xl mx-auto",
  };

  return (
    <div className={`${layoutClasses[layout]} ${className || ""}`}>
      <div className="space-y-8">
        {Object.entries(fieldsBySection).map(([sectionName, fields]) => {
          if (fields.length === 0) return null;

          return (
            <DetailSection
              key={sectionName}
              title={sectionName !== "default" ? sectionName : undefined}
            >
              {fields}
            </DetailSection>
          );
        })}
      </div>
      {children}
    </div>
  );
};
