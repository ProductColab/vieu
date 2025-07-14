import * as z from "zod";
import type { ConditionalDisplay } from "./conditional.types";

/**
 * Base field properties that apply across all view contexts
 */
export interface BaseFieldProps {
  /** Primary display label (used everywhere unless overridden) */
  label: string;
  /** Icon representing this field (used everywhere unless overridden) */
  icon?: string;
  /** Help text or description */
  description?: string;
  /** Whether field is generally clickable across contexts */
  clickable?: boolean;
  /** Global conditional display logic */
  showWhen?: ConditionalDisplay;
  /** Whether this field is generally readonly */
  readonly?: boolean;
  /** Priority for ordering/prominence */
  priority?: "high" | "medium" | "low";
}

/**
 * Context-specific overrides for different CRUD operations
 */
export interface FieldContextOverrides {
  /** Input context (forms, editing) */
  input?: {
    label?: string;
    placeholder?: string;
    inputType?:
      | "text"
      | "email"
      | "number"
      | "password"
      | "tel"
      | "url"
      | "textarea"
      | "select"
      | "checkbox";
    rows?: number;
    required?: boolean;
    showWhen?: ConditionalDisplay;
    skip?: boolean;
  };

  /** Display context (tables, cards, lists, details) */
  display?: {
    label?: string;
    icon?: string;
    clickable?: boolean;
    showWhen?: ConditionalDisplay;
    skip?: boolean;
  };

  /** List context (table rows, list items) */
  list?: {
    sortable?: boolean;
    width?: string;
    align?: "left" | "center" | "right";
    displayType?:
      | "text"
      | "number"
      | "boolean"
      | "badge"
      | "link"
      | "date"
      | "email"
      | "url";
    truncate?: boolean;
    position?: "primary" | "secondary" | "meta" | "action";
    asBadge?: boolean;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    showWhen?: ConditionalDisplay;
  };

  /** Detail context (detailed view, editing) */
  detail?: {
    section?: string;
    layout?: "full-width" | "half-width" | "third-width";
    presentation?: "default" | "highlighted" | "bordered" | "card";
    textSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
    showInDetail?: boolean;
    showWhen?: ConditionalDisplay;
  };

  /** Card context (preview cards, compact display) */
  card?: {
    size?: "sm" | "md" | "lg";
    style?: "primary" | "secondary" | "accent" | "muted";
    position?: "header" | "body" | "footer";
    showInPreview?: boolean;
    showWhen?: ConditionalDisplay;
  };
}

/**
 * Smart defaults inferred from Zod schema
 */
export interface SmartDefaults {
  inputType?: string;
  displayType?: string;
  label?: string;
  icon?: string;
  clickable?: boolean;
  sortable?: boolean;
  required?: boolean;
}

/**
 * Complete field definition combining base props, context overrides, and smart defaults
 */
export interface FieldDefinition extends BaseFieldProps {
  /** The Zod schema for this field */
  schema: z.ZodTypeAny;
  /** Context-specific overrides */
  contexts?: FieldContextOverrides;
  /** Smart defaults (computed from schema) */
  _smartDefaults?: SmartDefaults;
}

/**
 * Infers smart defaults from a Zod schema
 */
export function inferSmartDefaults(
  schema: z.ZodTypeAny,
  fieldName: string
): SmartDefaults {
  const defaults: SmartDefaults = {};

  // Get the base type
  let baseType = schema as z.ZodTypeAny;
  if (schema instanceof z.ZodOptional) {
    baseType = schema.unwrap() as z.ZodTypeAny;
  }

  // Infer from schema type
  if (baseType instanceof z.ZodString) {
    defaults.inputType = "text";
    defaults.displayType = "text";
    defaults.sortable = true;
    defaults.clickable = true;

    // Check for email constraint - use a safer approach
    try {
      const result = baseType.safeParse("test@example.com");
      const emailResult = baseType.safeParse("invalid-email");
      if (result.success && !emailResult.success) {
        defaults.inputType = "email";
        defaults.displayType = "email";
        defaults.icon = "✉️";
      }
    } catch {
      // If parsing fails, stick with text defaults
    }
  } else if (baseType instanceof z.ZodNumber) {
    defaults.inputType = "number";
    defaults.displayType = "number";
    defaults.sortable = true;
  } else if (baseType instanceof z.ZodBoolean) {
    defaults.inputType = "checkbox";
    defaults.displayType = "boolean";
    defaults.sortable = true;
  } else if (baseType instanceof z.ZodEnum || baseType instanceof z.ZodUnion) {
    defaults.inputType = "select";
    defaults.displayType = "badge";
    defaults.sortable = true;
  } else if (baseType instanceof z.ZodDate) {
    defaults.displayType = "date";
    defaults.sortable = true;
    defaults.icon = "📅";
  }

  // Infer label from field name
  if (!defaults.label) {
    defaults.label =
      fieldName.charAt(0).toUpperCase() +
      fieldName.slice(1).replace(/([A-Z])/g, " $1");
  }

  // Infer required from schema
  defaults.required = !(schema instanceof z.ZodOptional);

  return defaults;
}

/**
 * New field builder that eliminates repetition
 */
export class SmartFieldBuilder<T extends z.ZodTypeAny> {
  private definition: FieldDefinition;

  constructor(schema: T, fieldName: string) {
    this.definition = {
      schema,
      label: "", // Will be set by smart defaults
      _smartDefaults: inferSmartDefaults(schema, fieldName),
    };
  }

  /**
   * Set base properties that apply across all contexts
   */
  base(props: Partial<BaseFieldProps>): this {
    Object.assign(this.definition, props);
    return this;
  }

  /**
   * Set context-specific overrides
   */
  contexts(overrides: FieldContextOverrides): this {
    this.definition.contexts = { ...this.definition.contexts, ...overrides };
    return this;
  }

  /**
   * Quick helper for input context
   */
  input(props: NonNullable<FieldContextOverrides["input"]>): this {
    this.definition.contexts = { ...this.definition.contexts, input: props };
    return this;
  }

  /**
   * Quick helper for display context
   */
  display(props: NonNullable<FieldContextOverrides["display"]>): this {
    this.definition.contexts = { ...this.definition.contexts, display: props };
    return this;
  }

  /**
   * Quick helper for list context
   */
  list(props: NonNullable<FieldContextOverrides["list"]>): this {
    this.definition.contexts = { ...this.definition.contexts, list: props };
    return this;
  }

  /**
   * Quick helper for detail context
   */
  detail(props: NonNullable<FieldContextOverrides["detail"]>): this {
    this.definition.contexts = { ...this.definition.contexts, detail: props };
    return this;
  }

  /**
   * Quick helper for card context
   */
  card(props: NonNullable<FieldContextOverrides["card"]>): this {
    this.definition.contexts = { ...this.definition.contexts, card: props };
    return this;
  }

  /**
   * Quick helper for table context (alias for list)
   */
  table(props: NonNullable<FieldContextOverrides["list"]>): this {
    this.definition.contexts = { ...this.definition.contexts, list: props };
    return this;
  }

  build(): FieldDefinition {
    // Merge smart defaults with explicit values
    const smartDefaults = this.definition._smartDefaults || {};

    return {
      ...this.definition,
      label: this.definition.label || smartDefaults.label || "Field",
      icon: this.definition.icon || smartDefaults.icon,
      clickable: this.definition.clickable ?? smartDefaults.clickable ?? false,
      priority: this.definition.priority || "medium",
    };
  }
}

/**
 * Create a smart field definition
 */
export function defineSmartField<T extends z.ZodTypeAny>(
  schema: T,
  fieldName: string
): SmartFieldBuilder<T> {
  return new SmartFieldBuilder(schema, fieldName);
}

/**
 * Get resolved properties for a specific context
 */
export function getContextualProps(
  definition: FieldDefinition,
  context: keyof FieldContextOverrides
): Record<string, any> {
  const smartDefaults = definition._smartDefaults || {};
  const contextOverrides = definition.contexts?.[context] || {};

  // Merge in order: smart defaults -> base props -> context overrides
  return {
    ...smartDefaults,
    label: definition.label,
    icon: definition.icon,
    clickable: definition.clickable,
    priority: definition.priority,
    readonly: definition.readonly,
    showWhen: definition.showWhen,
    ...contextOverrides,
  };
}

/**
 * Semantic field types with built-in defaults
 */
export const semanticFields = {
  personName: (required = true) =>
    defineSmartField(
      required ? z.string().min(2) : z.string().min(2).optional(),
      "name"
    ).base({ label: "Full Name", icon: "👤", priority: "high" }),

  email: (required = true) =>
    defineSmartField(
      required ? z.string().email() : z.string().email().optional(),
      "email"
    ).base({
      label: "Email Address",
      icon: "✉️",
      clickable: true,
      priority: "high",
    }),

  phone: (required = false) =>
    defineSmartField(
      required ? z.string() : z.string().optional(),
      "phone"
    ).base({ label: "Phone Number", icon: "📞", clickable: true }),

  age: (required = true) =>
    defineSmartField(
      required
        ? z.number().int().min(0).max(120)
        : z.number().int().min(0).max(120).optional(),
      "age"
    ).base({ label: "Age", icon: "🎂" }),

  status: <T extends readonly [string, ...string[]]>(
    values: T,
    required = true
  ) =>
    defineSmartField(
      required ? z.enum(values) : z.enum(values).optional(),
      "status"
    ).base({ label: "Status", icon: "🟢" }),

  role: <T extends readonly [string, ...string[]]>(
    values: T,
    required = true
  ) =>
    defineSmartField(
      required ? z.enum(values) : z.enum(values).optional(),
      "role"
    ).base({ label: "Role", icon: "🔑" }),

  bio: (required = false) =>
    defineSmartField(
      required ? z.string().min(10) : z.string().min(10).optional(),
      "bio"
    )
      .base({ label: "Biography", icon: "📝" })
      .input({ inputType: "textarea", rows: 4 }),

  createdAt: () =>
    defineSmartField(z.date(), "createdAt")
      .base({ label: "Created", icon: "📅", readonly: true, priority: "low" })
      .input({ skip: true }),

  updatedAt: () =>
    defineSmartField(z.date(), "updatedAt")
      .base({ label: "Updated", icon: "📅", readonly: true, priority: "low" })
      .input({ skip: true }),
};
