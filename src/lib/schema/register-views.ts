import * as z from "zod";
import {
  formRegistry,
  tableRegistry,
  cardRegistry,
  listRegistry,
  detailRegistry,
} from "../views";
import { queryRegistry } from "../query/query.registry";
import type { FormFieldMetadata } from "../views/form/form.registry";
import type { TableColumnMetadata } from "../views/table/table.registry";
import type { CardItemMetadata } from "../views/card/card.registry";
import type { ListItemMetadata } from "../views/list/list.registry";
import type { DetailFieldMetadata } from "../views/detail/detail.registry";
import type { QueryMetadata } from "../query/query.registry";

type ViewMetadata = {
  input?: Omit<FormFieldMetadata, "label" | "showWhen">;
  table?: Omit<TableColumnMetadata, "label" | "showWhen">;
  card?: Omit<CardItemMetadata, "label" | "showWhen">;
  list?: Omit<ListItemMetadata, "label" | "showWhen">;
  detail?: Omit<DetailFieldMetadata, "label" | "showWhen">;
  query?: QueryMetadata<any, any>;
  showWhen?: FormFieldMetadata["showWhen"];
};

type SchemaMetadata = Record<string, ViewMetadata>;

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

    // Register with form registry
    if (fieldMetadata.input) {
      formRegistry.add(fieldSchema, {
        label,
        ...fieldMetadata.input,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register with table registry
    if (fieldMetadata.table) {
      tableRegistry.add(fieldSchema, {
        label,
        ...fieldMetadata.table,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register with card registry
    if (fieldMetadata.card) {
      cardRegistry.add(fieldSchema, {
        label,
        ...fieldMetadata.card,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register with list registry
    if (fieldMetadata.list) {
      listRegistry.add(fieldSchema, {
        label,
        ...fieldMetadata.list,
        showWhen: fieldMetadata.showWhen,
      });
    }

    // Register with detail registry
    if (fieldMetadata.detail) {
      detailRegistry.add(fieldSchema, {
        label,
        ...fieldMetadata.detail,
        showWhen: fieldMetadata.showWhen,
      });
    }
  });

  return schema;
}

/**
 * Register view metadata for multiple Zod schemas at once
 */
export function registerViewMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  metadata: SchemaMetadata
) {
  schemas.forEach((schema) => registerViewMetadata(schema, metadata));
  return schemas;
}

/**
 * Register query metadata for multiple schemas at once
 */
export function registerQueryMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  queryMetadata: QueryMetadata<any, any>
) {
  schemas.forEach((schema) => {
    queryRegistry.add(schema, queryMetadata as any);
  });
  return schemas;
}

/**
 * Register both view and query metadata for multiple schemas at once
 */
export function registerMetadataForSchemas<T extends z.ZodRawShape>(
  schemas: z.ZodObject<T>[],
  viewMetadata: SchemaMetadata,
  queryMetadata: QueryMetadata<any, any>
) {
  registerViewMetadataForSchemas(schemas, viewMetadata);
  registerQueryMetadataForSchemas(schemas, queryMetadata);
  return schemas;
}
