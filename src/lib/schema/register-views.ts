import * as z from "zod";
import {
  formRegistry,
  tableRegistry,
  cardRegistry,
  listRegistry,
  detailRegistry,
} from "../views";
import { queryRegistry } from "../query/query.registry";
import type { FormFieldMetadata, FormSections } from "../views/form/form.registry";
import { registerFormSections } from "../views/form/form.registry";
import type { TableColumnMetadata } from "../views/table/table.registry";
import type { CardItemMetadata } from "../views/card/card.registry";
import type { ListItemMetadata } from "../views/list/list.registry";
import type { DetailFieldMetadata } from "../views/detail/detail.registry";
import type { QueryMetadata } from "../query/query.registry";

type ViewMetadata = {
  input?: Omit<FormFieldMetadata, "label" | "showWhen">;
  form?: Omit<FormFieldMetadata, "label" | "showWhen">;
  table?: Omit<TableColumnMetadata, "label" | "showWhen">;
  card?: Omit<CardItemMetadata, "label" | "showWhen">;
  list?: Omit<ListItemMetadata, "label" | "showWhen">;
  detail?: Omit<DetailFieldMetadata, "label" | "showWhen">;
  query?: QueryMetadata<any, any>;
  showWhen?: FormFieldMetadata["showWhen"];
};

type SchemaMetadata = Record<string, ViewMetadata>;

/**
 * Extended query metadata that includes form sections
 */
export type ExtendedQueryMetadata = QueryMetadata<any, any> & {
  formSections?: FormSections;
};

/**
 * Register view metadata for a regular Zod schema
 */
export function registerViewMetadata<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  metadata: SchemaMetadata
) {
  const shape = schema.shape;

  // Register query metadata at the schema level (not per field)
  const queryMetadata = Object.values(metadata).find(
    (field) => field.query
  )?.query;
  if (queryMetadata) {
    queryRegistry.add(schema, queryMetadata as any);
  }

  Object.entries(metadata).forEach(([fieldName, fieldMetadata]) => {
    const fieldSchema = shape[fieldName];
    if (!fieldSchema) return;

    const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    // Register form metadata
    if (fieldMetadata.input || fieldMetadata.form) {
      const formMetadata = fieldMetadata.form || fieldMetadata.input;
      if (formMetadata) {
        formRegistry.add(fieldSchema, {
          ...formMetadata,
          label,
          showWhen: fieldMetadata.showWhen,
        });
      }
    }

    // Register table metadata
    if (fieldMetadata.table) {
      tableRegistry.add(fieldSchema, {
        ...fieldMetadata.table,
        label,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register card metadata
    if (fieldMetadata.card) {
      cardRegistry.add(fieldSchema, {
        ...fieldMetadata.card,
        label,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register list metadata
    if (fieldMetadata.list) {
      listRegistry.add(fieldSchema, {
        ...fieldMetadata.list,
        label,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register detail metadata
    if (fieldMetadata.detail) {
      detailRegistry.add(fieldSchema, {
        ...fieldMetadata.detail,
        label,
        showWhen: fieldMetadata.showWhen,
      });
    }
  });
}

/**
 * Register view metadata for multiple schemas
 */
export function registerViewMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  metadata: SchemaMetadata
) {
  schemas.forEach((schema) => registerViewMetadata(schema, metadata));
}

/**
 * Register query metadata for multiple schemas
 */
export function registerQueryMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  queryMetadata: ExtendedQueryMetadata
) {
  schemas.forEach((schema) => {
    queryRegistry.add(schema, queryMetadata as any);
    
    // Register form sections if provided
    if (queryMetadata.formSections) {
      registerFormSections(schema, queryMetadata.formSections);
    }
  });
}

/**
 * Register both view and query metadata for multiple schemas
 */
export function registerMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  viewMetadata: SchemaMetadata,
  queryMetadata: ExtendedQueryMetadata
) {
  registerViewMetadataForSchemas(schemas, viewMetadata);
  registerQueryMetadataForSchemas(schemas, queryMetadata);
  return schemas;
}
