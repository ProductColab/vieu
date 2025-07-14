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
 * List-specific metadata for item display
 */
export interface ListItemMetadata extends BaseMetadata {
  label: string;
  /** Display position within the list item */
  position?: "primary" | "secondary" | "meta" | "action";
  /** Icon to display with the field */
  icon?: string;
  /** Whether this field is clickable */
  clickable?: boolean;
  /** Show as a badge/chip */
  asBadge?: boolean;
  /** Truncate long text */
  truncate?: boolean;
  /** Badge variant for status indicators */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Button variant for actions */
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Button size for actions */
  buttonSize?: "default" | "sm" | "lg" | "icon";
  showWhen?: ConditionalDisplay;
}

/**
 * List component props
 */
export type ListComponentProps = BaseComponentProps<ListItemMetadata> & {
  /** Current item data */
  itemData?: Record<string, unknown>;
  /** Click handler for the field */
  onClick?: (fieldName: string, value: unknown) => void;
  /** Whether the list item is selected */
  selected?: boolean;
  /** Custom action handler for buttons */
  onAction?: (action: string, itemData: Record<string, unknown>) => void;
};

/**
 * List component type mapping
 */
export const listComponentTypeMap: ComponentTypeMap = {
  text: "list-text",
  email: "list-contact",
  number: "list-text",
  select: "list-badge",
  boolean: "list-badge",
  date: "list-text",
  url: "list-link",
};

/**
 * List-specific component type getter
 */
export const getListComponentType = createComponentTypeGetter<ListItemMetadata>(
  listComponentTypeMap,
  (metadata) => {
    // Override with badge if specified
    if (metadata.asBadge) return "list-badge";
    // Override with button if in action position
    if (metadata.position === "action") return "list-action";
    return undefined; // Use default mapping
  }
);

/**
 * List props builder
 */
export const buildListProps: PropsBuilder<
  ListItemMetadata,
  ListComponentProps
> = (
  schema: z.ZodType,
  metadata: ListItemMetadata,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
): ListComponentProps => {
  const props = (extraProps as Record<string, unknown>) || {};

  return {
    schema,
    metadata,
    value,
    fieldName,
    className,
    itemData: props.itemData as Record<string, unknown>,
    onClick: props.onClick as (fieldName: string, value: unknown) => void,
    selected: props.selected as boolean,
    onAction: props.onAction as (
      action: string,
      itemData: Record<string, unknown>
    ) => void,
  };
};
