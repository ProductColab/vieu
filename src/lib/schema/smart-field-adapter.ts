import * as z from "zod";
import type { FieldDefinition } from "./field-definition-v2";
import { getContextualProps } from "./field-definition-v2";
import {
  formRegistry,
  tableRegistry,
  cardRegistry,
  listRegistry,
  detailRegistry,
} from "../views";
import { queryRegistry } from "../query";
import type { CrossFieldValidation } from "./conditional.types";

/**
 * Configuration for creating an entity from smart field definitions
 */
export interface SmartEntityConfig {
  name: string;
  fields: Record<string, FieldDefinition>;
  transport?: "rest" | "server-actions";
  serverActions?: any;
  cacheConfig?: {
    staleTime?: number;
    gcTime?: number;
  };
  validation?: CrossFieldValidation[];
}

/**
 * Registers smart field definitions with the existing view registries
 */
export function registerSmartFields(fields: Record<string, FieldDefinition>) {
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const schema = fieldDef.schema;

    // Register with form registry
    const formProps = getContextualProps(fieldDef, "input");
    if (!formProps.skip) {
      schema.register(formRegistry, {
        label: formProps.label,
        placeholder: formProps.placeholder,
        inputType: formProps.inputType,
        rows: formProps.rows,
        showWhen: formProps.showWhen,
      });
    }

    // Register with table registry (using list context)
    const tableProps = getContextualProps(fieldDef, "list");
    if (!tableProps.skip) {
      schema.register(tableRegistry, {
        label: tableProps.label,
        width: tableProps.width,
        sortable: tableProps.sortable,
        align: tableProps.align,
        displayType: tableProps.displayType,
        showWhen: tableProps.showWhen,
      });
    }

    // Register with card registry
    const cardProps = getContextualProps(fieldDef, "card");
    if (!cardProps.skip) {
      schema.register(cardRegistry, {
        label: cardProps.label,
        size: cardProps.size,
        showInPreview: cardProps.showInPreview,
        icon: cardProps.icon,
        style: cardProps.style,
        clickable: cardProps.clickable,
        position: cardProps.position,
        showWhen: cardProps.showWhen,
      });
    }

    // Register with list registry
    const listProps = getContextualProps(fieldDef, "list");
    if (!listProps.skip) {
      schema.register(listRegistry, {
        label: listProps.label,
        position: listProps.position,
        icon: listProps.icon,
        clickable: listProps.clickable,
        asBadge: listProps.asBadge,
        truncate: listProps.truncate,
        badgeVariant: listProps.badgeVariant,
        showWhen: listProps.showWhen,
      });
    }

    // Register with detail registry
    const detailProps = getContextualProps(fieldDef, "detail");
    if (!detailProps.skip) {
      schema.register(detailRegistry, {
        label: detailProps.label,
        section: detailProps.section,
        priority: detailProps.priority,
        layout: detailProps.layout,
        presentation: detailProps.presentation,
        showLabel: detailProps.showLabel,
        helpText: detailProps.helpText,
        icon: detailProps.icon,
        clickable: detailProps.clickable,
        asBadge: detailProps.asBadge,
        badgeVariant: detailProps.badgeVariant,
        textSize: detailProps.textSize,
        showInDetail: detailProps.showInDetail,
        showWhen: detailProps.showWhen,
      });
    }
  }
}

/**
 * Creates entity schemas from smart field definitions
 */
export function createSmartEntity(config: SmartEntityConfig) {
  // Register all fields with view registries
  registerSmartFields(config.fields);

  // Extract Zod schemas
  const zodFields: Record<string, z.ZodTypeAny> = {};
  for (const [fieldName, fieldDef] of Object.entries(config.fields)) {
    zodFields[fieldName] = fieldDef.schema;
  }

  const entitySchema = z.object(zodFields);

  // Create form and update schemas
  const formFields: Record<string, z.ZodTypeAny> = {};
  const updateFields: Record<string, z.ZodTypeAny> = {};

  for (const [fieldName, fieldDef] of Object.entries(config.fields)) {
    const inputProps = getContextualProps(fieldDef, "input");

    if (!inputProps.skip && !fieldDef.readonly) {
      formFields[fieldName] = fieldDef.schema;
    }

    if (!fieldDef.readonly) {
      updateFields[fieldName] = fieldDef.schema.optional();
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

  // Register with query registry if needed
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

    // Backward compatibility with existing naming
    schema: entitySchema,
    formSchema: createSchema,
    updateSchema: updateSchema,
    cardSchema: entitySchema,
    listSchema: entitySchema,
    detailSchema: entitySchema,

    name: config.name,
    config: config,
  };
}
