import React from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { createSchemaFieldRenderer, createViewRegistry } from "../../schema";
import { shouldShowFieldInView } from "../../schema/conditional.utils";
import {
  getCardComponentType,
  buildCardProps,
  type CardItemMetadata,
  type CardComponentProps,
} from "./card.registry";

/**
 * Card text field component
 */
export const CardText = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata, fieldName, onClick } = props;
  const displayValue = String(value || "");

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const styleClasses = {
    primary: "text-foreground font-medium",
    secondary: "text-muted-foreground",
    accent: "text-accent-foreground",
    muted: "text-muted-foreground text-sm",
  };

  return (
    <div
      className={`${sizeClasses[metadata.size || "md"]} ${
        styleClasses[metadata.style || "primary"]
      } ${metadata.clickable ? "cursor-pointer hover:text-primary" : ""}`}
      onClick={
        metadata.clickable ? () => onClick?.(fieldName, value) : undefined
      }
    >
      {metadata.icon && <span className="mr-2">{metadata.icon}</span>}
      <span className="font-medium">{metadata.label}:</span> {displayValue}
    </div>
  );
};

/**
 * Card contact field (email/phone) component
 */
export const CardContact = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata, fieldName } = props;
  const displayValue = String(value || "");

  return (
    <div className="flex items-center gap-2">
      {metadata.icon && (
        <span className="text-muted-foreground">{metadata.icon}</span>
      )}
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-sm"
        onClick={() => {
          if (fieldName === "email") {
            window.location.href = `mailto:${displayValue}`;
          } else {
            window.location.href = `tel:${displayValue}`;
          }
        }}
      >
        {displayValue}
      </Button>
    </div>
  );
};

/**
 * Card badge component for numbers/counts
 */
export const CardBadge = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata } = props;
  const displayValue = String(value || "0");

  const variants = {
    primary: "default" as const,
    secondary: "secondary" as const,
    accent: "outline" as const,
    muted: "secondary" as const,
  };

  return (
    <div className="flex items-center gap-2">
      {metadata.icon && (
        <span className="text-muted-foreground">{metadata.icon}</span>
      )}
      <Badge variant={variants[metadata.style || "primary"]}>
        {metadata.label}: {displayValue}
      </Badge>
    </div>
  );
};

/**
 * Card status component for select/enum fields
 */
export const CardStatus = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata } = props;
  const displayValue = String(value || "");

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "success":
        return "default";
      case "inactive":
      case "error":
        return "destructive";
      case "pending":
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {metadata.icon && (
        <span className="text-muted-foreground">{metadata.icon}</span>
      )}
      <Badge variant={getStatusVariant(displayValue) as any}>
        {displayValue}
      </Badge>
    </div>
  );
};

/**
 * Card indicator component for boolean fields
 */
export const CardIndicator = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata } = props;
  const isTrue = Boolean(value);

  return (
    <div className="flex items-center gap-2">
      {metadata.icon && (
        <span className="text-muted-foreground">{metadata.icon}</span>
      )}
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isTrue ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm">{metadata.label}</span>
      </div>
    </div>
  );
};

/**
 * Card timestamp component for date fields
 */
export const CardTimestamp = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata } = props;
  const date = value instanceof Date ? value : new Date(String(value));

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {metadata.icon && <span>{metadata.icon}</span>}
      <time>{formatDate(date)}</time>
    </div>
  );
};

/**
 * Card link component for URL fields
 */
export const CardLink = ({ props }: { props: CardComponentProps }) => {
  const { value, metadata } = props;
  const url = String(value || "");

  return (
    <div className="flex items-center gap-2">
      {metadata.icon && (
        <span className="text-muted-foreground">{metadata.icon}</span>
      )}
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-sm"
        onClick={() => window.open(url, "_blank")}
      >
        {url}
      </Button>
    </div>
  );
};

/**
 * Card component map
 */
export const cardComponentMap = {
  "card-text": (props: CardComponentProps) => <CardText props={props} />,
  "card-contact": (props: CardComponentProps) => <CardContact props={props} />,
  "card-badge": (props: CardComponentProps) => <CardBadge props={props} />,
  "card-status": (props: CardComponentProps) => <CardStatus props={props} />,
  "card-indicator": (props: CardComponentProps) => (
    <CardIndicator props={props} />
  ),
  "card-timestamp": (props: CardComponentProps) => (
    <CardTimestamp props={props} />
  ),
  "card-link": (props: CardComponentProps) => <CardLink props={props} />,
};

/**
 * Create card registry system
 */
const cardRegistrySystem = createViewRegistry(
  cardComponentMap,
  getCardComponentType,
  buildCardProps
);

/**
 * Card field renderer
 */
export const CardFieldRenderer = createSchemaFieldRenderer(cardRegistrySystem);

/**
 * Schema-driven card component
 */
export const SchemaCard = ({
  schema,
  data,
  onItemClick,
  className,
  selected = false,
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>;
  onItemClick?: (data: Record<string, unknown>) => void;
  className?: string;
  selected?: boolean;
  children?: React.ReactNode;
}) => {
  const fieldsByPosition = {
    header: [] as React.ReactElement[],
    body: [] as React.ReactElement[],
    footer: [] as React.ReactElement[],
  };

  if ("shape" in schema) {
    const shape = schema.shape as Record<string, z.ZodType>;
    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      const metadata = cardRegistrySystem.get(fieldSchema) as CardItemMetadata;

      if (!metadata || !metadata.showInPreview) return;

      // Check conditional display logic
      if (metadata.showWhen) {
        const shouldShow = shouldShowFieldInView(metadata.showWhen, data);
        if (!shouldShow) return;
      }

      const element = (
        <CardFieldRenderer
          key={fieldName}
          schema={fieldSchema}
          fieldName={fieldName}
          value={data[fieldName]}
          itemData={data}
          selected={selected}
          onClick={onItemClick ? () => onItemClick(data) : undefined}
        />
      );

      const position = metadata.position || "body";
      fieldsByPosition[position].push(element);
    });
  }

  return (
    <Card
      className={`${className || ""} ${selected ? "ring-2 ring-primary" : ""} ${
        onItemClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
      onClick={onItemClick ? () => onItemClick(data) : undefined}
    >
      {fieldsByPosition.header.length > 0 && (
        <CardHeader className="pb-3">
          <div className="space-y-2">{fieldsByPosition.header}</div>
        </CardHeader>
      )}

      <CardContent className="pt-3">
        <div className="space-y-3">{fieldsByPosition.body}</div>
      </CardContent>

      {fieldsByPosition.footer.length > 0 && (
        <CardFooter className="pt-3">
          <div className="flex flex-wrap gap-2">{fieldsByPosition.footer}</div>
        </CardFooter>
      )}

      {children}
    </Card>
  );
};

/**
 * Schema-driven card grid component
 */
export const SchemaCardGrid = ({
  schema,
  data,
  onItemClick,
  className,
  selectedItems = [],
  children,
}: {
  schema: z.ZodType;
  data: Record<string, unknown>[];
  onItemClick?: (item: Record<string, unknown>) => void;
  className?: string;
  selectedItems?: Record<string, unknown>[];
  children?: React.ReactNode;
}) => {
  return (
    <div className={`grid gap-4 ${className || ""}`}>
      {data.map((item, index) => (
        <SchemaCard
          key={index}
          schema={schema}
          data={item}
          onItemClick={onItemClick}
          selected={selectedItems.some((selected) => selected.id === item.id)}
        />
      ))}
      {children}
    </div>
  );
};

/**
 * Export the raw registry for use in schema registration
 */
export const cardRegistry = cardRegistrySystem.registry;

/**
 * Export the full registry system for component rendering
 */
export { cardRegistrySystem };
