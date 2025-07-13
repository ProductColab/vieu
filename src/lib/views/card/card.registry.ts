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
 * Card-specific metadata for item display
 */
export interface CardItemMetadata extends BaseMetadata {
  label: string;
  /** Size of the card field */
  size?: "sm" | "md" | "lg";
  /** Whether to show this field in card preview */
  showInPreview?: boolean;
  /** Icon to display with the field */
  icon?: string;
  /** Display style for the field */
  style?: "primary" | "secondary" | "accent" | "muted";
  /** Whether this field is clickable */
  clickable?: boolean;
  /** Position in card layout */
  position?: "header" | "body" | "footer";
  showWhen?: ConditionalDisplay;
}

/**
 * Card component props
 */
export type CardComponentProps = BaseComponentProps<CardItemMetadata> & {
  /** Current item data */
  itemData?: Record<string, unknown>;
  /** Click handler for the field */
  onClick?: (fieldName: string, value: unknown) => void;
  /** Whether the card is selected */
  selected?: boolean;
};

/**
 * Card component type mapping
 */
export const cardComponentTypeMap: ComponentTypeMap = {
  text: "card-text",
  email: "card-contact",
  number: "card-badge",
  select: "card-status",
  boolean: "card-indicator",
  date: "card-timestamp",
  url: "card-link",
};

/**
 * Card-specific component type getter
 */
export const getCardComponentType = createComponentTypeGetter<CardItemMetadata>(
  cardComponentTypeMap,
  (metadata) => metadata.style
);

/**
 * Card props builder
 */
export const buildCardProps: PropsBuilder<
  CardItemMetadata,
  CardComponentProps
> = (
  schema: z.ZodType,
  metadata: CardItemMetadata,
  value: unknown,
  fieldName: string,
  className?: string,
  extraProps?: unknown
): CardComponentProps => {
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
  };
};
