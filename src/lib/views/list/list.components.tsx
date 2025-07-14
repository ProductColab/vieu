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
  getListComponentType,
  buildListProps,
  type ListItemMetadata,
  type ListComponentProps,
} from "./list.registry";

/**
 * List text component - displays text content with optional truncation
 */
export const ListText = ({ props }: { props: ListComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const sizeClasses = {
    primary: "text-base font-medium",
    secondary: "text-sm text-muted-foreground",
    meta: "text-xs text-muted-foreground",
    action: "text-sm",
  };

  const content =
    metadata.truncate && displayValue.length > 50
      ? `${displayValue.substring(0, 50)}...`
      : displayValue;

  const textElement = (
    <span
      className={`${sizeClasses[metadata.position || "primary"]} ${
        metadata.clickable ? "cursor-pointer hover:text-primary" : ""
      }`}
      onClick={
        metadata.clickable ? () => onClick?.(fieldName, value) : undefined
      }
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      {content}
    </span>
  );

  // Show tooltip if truncated
  if (metadata.truncate && displayValue.length > 50) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{textElement}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-sm">{displayValue}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return textElement;
};

/**
 * List contact component - displays email/phone with link
 */
export const ListContact = ({ props }: { props: ListComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const isEmail = displayValue.includes("@");
  const href = isEmail ? `mailto:${displayValue}` : `tel:${displayValue}`;

  const sizeClasses = {
    primary: "text-base font-medium",
    secondary: "text-sm text-muted-foreground",
    meta: "text-xs text-muted-foreground",
    action: "text-sm",
  };

  return (
    <a
      href={href}
      className={`${
        sizeClasses[metadata.position || "primary"]
      } text-blue-600 hover:text-blue-800 hover:underline`}
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
 * List badge component - displays status or tags as badges
 */
export const ListBadge = ({ props }: { props: ListComponentProps }) => {
  const { value, metadata } = props;
  const displayValue = String(value || "");

  if (!displayValue) return null;

  return (
    <Badge variant={metadata.badgeVariant || "default"}>
      {metadata.icon && <span className="mr-1">{metadata.icon}</span>}
      {displayValue}
    </Badge>
  );
};

/**
 * List link component - displays URLs as clickable links
 */
export const ListLink = ({ props }: { props: ListComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const sizeClasses = {
    primary: "text-base font-medium",
    secondary: "text-sm text-muted-foreground",
    meta: "text-xs text-muted-foreground",
    action: "text-sm",
  };

  return (
    <a
      href={displayValue}
      target="_blank"
      rel="noopener noreferrer"
      className={`${
        sizeClasses[metadata.position || "primary"]
      } text-blue-600 hover:text-blue-800 hover:underline`}
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
 * List action component - displays action buttons
 */
export const ListAction = ({ props }: { props: ListComponentProps }) => {
  const { value, metadata, fieldName, itemData, onAction } = props;
  const displayValue = String(value || metadata.label || fieldName);

  const handleClick = () => {
    if (onAction && itemData) {
      onAction(fieldName, itemData);
    }
  };

  return (
    <Button
      variant={metadata.buttonVariant || "ghost"}
      size={metadata.buttonSize || "sm"}
      onClick={handleClick}
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      {displayValue}
    </Button>
  );
};

/**
 * List component map
 */
export const listComponentMap = {
  "list-text": (props: ListComponentProps) => <ListText props={props} />,
  "list-contact": (props: ListComponentProps) => <ListContact props={props} />,
  "list-badge": (props: ListComponentProps) => <ListBadge props={props} />,
  "list-link": (props: ListComponentProps) => <ListLink props={props} />,
  "list-action": (props: ListComponentProps) => <ListAction props={props} />,
};

/**
 * Create list registry system
 */
const listRegistrySystem = createViewRegistry(
  listComponentMap,
  getListComponentType,
  buildListProps
);

/**
 * List field renderer
 */
export const ListFieldRenderer = createSchemaFieldRenderer(listRegistrySystem);

/**
 * Export the raw registry for use in schema registration
 */
export const listRegistry = listRegistrySystem.registry;

/**
 * Schema-driven list item component
 */
export const SchemaListItem = ({
  schema,
  data,
  onItemClick,
  onAction,
  className,
  selected = false,
  showDivider = false,
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>;
  onItemClick?: (data: Record<string, unknown>) => void;
  onAction?: (action: string, itemData: Record<string, unknown>) => void;
  className?: string;
  selected?: boolean;
  showDivider?: boolean;
  children?: React.ReactNode;
}) => {
  const fieldsByPosition = {
    primary: [] as React.ReactElement[],
    secondary: [] as React.ReactElement[],
    meta: [] as React.ReactElement[],
    action: [] as React.ReactElement[],
  };

  if ("shape" in schema) {
    const shape = schema.shape as Record<string, z.ZodType>;
    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      const metadata = listRegistrySystem.get(fieldSchema) as ListItemMetadata;

      if (!metadata) return;

      // Check conditional display logic
      if (metadata.showWhen) {
        const shouldShow = shouldShowFieldInView(metadata.showWhen, data);
        if (!shouldShow) return;
      }

      const element = (
        <ListFieldRenderer
          key={fieldName}
          schema={fieldSchema}
          fieldName={fieldName}
          value={data[fieldName]}
          itemData={data}
          selected={selected}
          onAction={onAction}
          onClick={onItemClick ? () => onItemClick(data) : undefined}
        />
      );

      const position = metadata.position || "primary";
      fieldsByPosition[position].push(element);
    });
  }

  return (
    <div
      className={`${className || ""} ${selected ? "bg-muted/50" : ""} ${
        onItemClick ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""
      } ${showDivider ? "border-b border-border" : ""}`}
      onClick={onItemClick ? () => onItemClick(data) : undefined}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Primary content */}
            {fieldsByPosition.primary.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {fieldsByPosition.primary}
                </div>
              </div>
            )}

            {/* Secondary content */}
            {fieldsByPosition.secondary.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {fieldsByPosition.secondary}
                </div>
              </div>
            )}

            {/* Meta information */}
            {fieldsByPosition.meta.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {fieldsByPosition.meta}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {fieldsByPosition.action.length > 0 && (
            <div className="flex items-center gap-1 ml-4">
              {fieldsByPosition.action}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

/**
 * Schema-driven list component
 */
export const SchemaList = ({
  schema,
  data,
  onItemClick,
  onAction,
  className,
  selectedItems = [],
  showDividers = true,
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>[];
  onItemClick?: (item: Record<string, unknown>) => void;
  onAction?: (action: string, itemData: Record<string, unknown>) => void;
  className?: string;
  selectedItems?: Record<string, unknown>[];
  showDividers?: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <div className={`bg-background ${className || ""}`}>
      {data.map((item, index) => (
        <SchemaListItem
          key={index}
          schema={schema}
          data={item}
          onItemClick={onItemClick}
          onAction={onAction}
          selected={selectedItems.some((selected) => selected.id === item.id)}
          showDivider={showDividers && index < data.length - 1}
        />
      ))}
      {children}
    </div>
  );
};
