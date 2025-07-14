import * as z from "zod";
import {
  type BaseMetadata,
  type BaseComponentProps,
  type ComponentTypeMap,
  type PropsBuilder,
  createComponentTypeGetter,
} from "../../schema";
import type { ConditionalDisplay } from "../../schema/conditional.types";

/**
 * Detail-specific metadata for rich field display
 */
export interface DetailFieldMetadata extends BaseMetadata {
  label: string;
  /** Field grouping/section */
  section?: string;
  /** Display priority (higher = more prominent) */
  priority?: "high" | "medium" | "low";
  /** Layout within section */
  layout?: "full-width" | "half-width" | "third-width";
  /** Rich display options */
  presentation?: "default" | "highlighted" | "bordered" | "card";
  /** Whether to show label */
  showLabel?: boolean;
  /** Help text or description */
  helpText?: string;
  /** Icon to display with the field */
  icon?: string;
  /** Whether this field is clickable */
  clickable?: boolean;
  /** Show as a badge/chip */
  asBadge?: boolean;
  /** Badge variant for status indicators */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Text size for content */
  textSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  /** Whether to show this field in detail view */
  showInDetail?: boolean;
  showWhen?: ConditionalDisplay;
}

/**
 * Detail component props
 */
export type DetailComponentProps = BaseComponentProps<DetailFieldMetadata> & {
  /** Current item data */
  itemData?: Record<string, unknown>;
  /** Click handler for the field */
  onClick?: (fieldName: string, value: unknown) => void;
  /** Custom action handler */
  onAction?: (
    action: string,
    fieldName: string,
    itemData: Record<string, unknown>
  ) => void;
};

/**
 * Detail component type mapping
 */
export const detailComponentTypeMap: ComponentTypeMap = {
  text: "detail-text",
  email: "detail-contact",
  number: "detail-text",
  select: "detail-badge",
  boolean: "detail-badge",
  date: "detail-text",
  url: "detail-link",
};

/**
 * Detail-specific component type getter
 */
export const getDetailComponentType =
  createComponentTypeGetter<DetailFieldMetadata>(
    detailComponentTypeMap,
    (metadata) => {
      // Override with badge if specified
      if (metadata.asBadge) return "detail-badge";
      // Override with link for URLs
      if (metadata.clickable) return "detail-link";
      return undefined; // Use default mapping
    }
  );

/**
 * Detail props builder
 */
export const buildDetailProps: PropsBuilder<
  DetailFieldMetadata,
  DetailComponentProps
> = (
  schema: z.ZodType,
  metadata: DetailFieldMetadata,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
): DetailComponentProps => {
  const props = (extraProps as Record<string, unknown>) || {};

  return {
    schema,
    metadata,
    value,
    fieldName,
    className,
    itemData: props.itemData as Record<string, unknown>,
    onClick: props.onClick as (fieldName: string, value: unknown) => void,
    onAction: props.onAction as (
      action: string,
      fieldName: string,
      itemData: Record<string, unknown>
    ) => void,
  };
};
