import * as z from "zod";
import { formRegistry, tableRegistry, cardRegistry } from "../views";
import { queryRegistry } from "../query";
import type {
  ConditionalDisplay,
  CrossFieldValidation,
} from "./conditional.types";

interface FieldConfig<T extends z.ZodTypeAny> {
  type: T;
  form?: {
    skip?: boolean;
    label?: string;
    placeholder?: string;
    inputType?:
      | "text"
      | "email"
      | "number"
      | "textarea"
      | "select"
      | "checkbox";
    rows?: number;
    required?: boolean;
    showWhen?: ConditionalDisplay;
  };
  table?: {
    skip?: boolean;
    label?: string;
    width?: string;
    sortable?: boolean;
    align?: "left" | "center" | "right";
    displayType?: "text" | "email" | "date" | "badge" | "link";
    showWhen?: ConditionalDisplay;
  };
  card?: {
    skip?: boolean;
    label?: string;
    size?: "sm" | "md" | "lg";
    showInPreview?: boolean;
    icon?: string;
    style?: "primary" | "secondary" | "accent" | "muted";
    clickable?: boolean;
    position?: "header" | "body" | "footer";
    showWhen?: ConditionalDisplay;
  };
  query?: {
    skip?: boolean;
    readonly?: boolean;
  };
  meta?: {
    title?: string;
    description?: string;
    examples?: any[];
  };
}

interface EntityConfig<T extends Record<string, FieldConfig<any>>> {
  name: string;
  fields: T;
  transport?: "rest" | "server-actions";
  serverActions?: any;
  cacheConfig?: {
    staleTime?: number;
    gcTime?: number;
  };
  /** Cross-field validation rules */
  validation?: CrossFieldValidation[];
}

export function field<T extends z.ZodTypeAny>(type: T): FieldConfig<T> {
  return { type };
}

export class FieldBuilder<T extends z.ZodTypeAny> {
  private config: FieldConfig<T>;

  constructor(config: FieldConfig<T>) {
    this.config = config;
  }

  form(formConfig: NonNullable<FieldConfig<T>["form"]>) {
    this.config.form = { ...this.config.form, ...formConfig };
    return this;
  }

  table(tableConfig: NonNullable<FieldConfig<T>["table"]>) {
    this.config.table = { ...this.config.table, ...tableConfig };
    return this;
  }

  card(cardConfig: NonNullable<FieldConfig<T>["card"]>) {
    this.config.card = { ...this.config.card, ...cardConfig };
    return this;
  }

  query(queryConfig: NonNullable<FieldConfig<T>["query"]>) {
    this.config.query = { ...this.config.query, ...queryConfig };
    return this;
  }

  meta(metaConfig: NonNullable<FieldConfig<T>["meta"]>) {
    this.config.meta = { ...this.config.meta, ...metaConfig };
    return this;
  }

  build(): FieldConfig<T> {
    return this.config;
  }
}

export function defineField<T extends z.ZodTypeAny>(type: T): FieldBuilder<T> {
  return new FieldBuilder({ type });
}

export function defineEntity<T extends Record<string, FieldConfig<any>>>(
  config: EntityConfig<T>
) {
  const zodFields: Record<string, z.ZodTypeAny> = {};

  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    zodFields[fieldName] = fieldConfig.type;
  }

  const entitySchema = z.object(zodFields);

  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    const field = (entitySchema.shape as any)[fieldName];

    if (fieldConfig.form && !fieldConfig.form.skip) {
      field.register(formRegistry, {
        label: fieldConfig.form.label,
        placeholder: fieldConfig.form.placeholder,
        inputType: fieldConfig.form.inputType,
        rows: fieldConfig.form.rows,
        required: fieldConfig.form.required,
        showWhen: fieldConfig.form.showWhen,
      });
    }

    if (fieldConfig.table && !fieldConfig.table.skip) {
      field.register(tableRegistry, {
        label: fieldConfig.table.label,
        width: fieldConfig.table.width,
        sortable: fieldConfig.table.sortable,
        align: fieldConfig.table.align,
        displayType: fieldConfig.table.displayType,
        showWhen: fieldConfig.table.showWhen,
      });
    }

    if (fieldConfig.card && !fieldConfig.card.skip) {
      field.register(cardRegistry, {
        label: fieldConfig.card.label,
        size: fieldConfig.card.size,
        showInPreview: fieldConfig.card.showInPreview,
        icon: fieldConfig.card.icon,
        style: fieldConfig.card.style,
        clickable: fieldConfig.card.clickable,
        position: fieldConfig.card.position,
        showWhen: fieldConfig.card.showWhen,
      });
    }

    if (fieldConfig.meta) {
      field.meta(fieldConfig.meta);
    }
  }

  const formFields: Record<string, z.ZodTypeAny> = {};
  const updateFields: Record<string, z.ZodTypeAny> = {};

  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    if (
      fieldConfig.form &&
      !fieldConfig.form.skip &&
      !fieldConfig.query?.readonly
    ) {
      formFields[fieldName] = fieldConfig.type;
    }

    if (!fieldConfig.query?.readonly) {
      updateFields[fieldName] = fieldConfig.type.optional();
    }
  }

  let createSchema = z.object(formFields);
  let updateSchema = z.object(updateFields);

  // Apply cross-field validation if defined
  if (config.validation) {
    for (const rule of config.validation) {
      createSchema = createSchema.refine(rule.validate, {
        message: rule.message,
        path: rule.path,
      });
      updateSchema = updateSchema.refine(rule.validate, {
        message: rule.message,
        path: rule.path,
      });
    }
  }

  if (config.transport === "server-actions" && config.serverActions) {
    entitySchema.register(queryRegistry, {
      label: config.name,
      title: config.name,
      transport: "server-actions",
      serverActions: config.serverActions,
      cacheConfig: config.cacheConfig || {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    });
  }

  return {
    entity: entitySchema,
    create: createSchema,
    update: updateSchema,

    schema: entitySchema,
    formSchema: createSchema,
    updateSchema: updateSchema,
    cardSchema: entitySchema,

    name: config.name,
    config: config,
  };
}

export function createEntitySchemas<T extends Record<string, FieldConfig<any>>>(
  name: string,
  fields: T,
  options: {
    transport?: "rest" | "server-actions";
    serverActions?: any;
    cacheConfig?: { staleTime?: number; gcTime?: number };
  } = {}
) {
  return defineEntity({
    name,
    fields,
    transport: options.transport || "server-actions",
    serverActions: options.serverActions,
    cacheConfig: options.cacheConfig,
  });
}
