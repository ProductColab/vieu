import * as z from "zod";
import { type BaseMetadata, createRegistry } from "../schema";
import type { EntityConfig } from "./config";
import type {
  EntityId,
  BaseEntity,
  EntityMetadata,
  ListParams,
  GetParams,
  SearchParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  ListResult,
  SearchResult,
  EntityOperationError,
  MutationContext,
  QueryConfig,
  MutationConfig,
} from "./types";
import { createRestFetchers } from "./hooks";

/**
 * Server action functions for different Query operations.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 */
export type ServerActionFunctions<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> = {
  /** Server action for listing entities with pagination */
  list?: (params?: ListParams) => Promise<ListResult<TEntity>>;
  /** Server action for fetching a single entity by ID */
  get?: (params: GetParams<TId>) => Promise<TEntity>;
  /** Server action for searching entities */
  search?: (params: SearchParams) => Promise<SearchResult<TEntity>>;
  /** Server action for creating new entities */
  create?: (params: CreateParams<TEntity>) => Promise<TEntity>;
  /** Server action for updating existing entities */
  update?: (params: UpdateParams<TEntity, TId>) => Promise<TEntity>;
  /** Server action for deleting entities */
  delete?: (params: DeleteParams<TId>) => Promise<void>;
};

/**
 * REST transport configuration for API-based operations.
 */
export type RestTransportConfig = {
  /** Transport type identifier */
  transport: "rest";
  /** Base API endpoint for this entity */
  baseEndpoint: string;
  /** Custom API endpoints override */
  endpoints?: {
    /** Custom list endpoint */
    list?: string;
    /** Custom get endpoint */
    get?: string;
    /** Custom search endpoint */
    search?: string;
    /** Custom create endpoint */
    create?: string;
    /** Custom update endpoint */
    update?: string;
    /** Custom delete endpoint */
    delete?: string;
  };
  /** Default fetch options for all operations */
  fetchOptions?: RequestInit;
};

/**
 * Server actions transport configuration for server-side operations.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 */
export type ServerActionsTransportConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> = {
  /** Transport type identifier */
  transport: "server-actions";
  /** Server action functions for each operation */
  serverActions: ServerActionFunctions<TEntity, TId>;
};

/**
 * Union type for all supported transport configurations.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 */
export type TransportConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> = RestTransportConfig | ServerActionsTransportConfig<TEntity, TId>;

/**
 * Query-specific metadata that extends base metadata with API configuration.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 */
export type QueryMetadata<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> = BaseMetadata &
  TransportConfig<TEntity, TId> & {
    /** Entity name for queries and cache keys */
    title: string;
    /** Entity-specific cache configuration */
    cacheConfig?: {
      /** Time in milliseconds before data is considered stale */
      staleTime?: number;
      /** Time in milliseconds before unused data is garbage collected */
      gcTime?: number;
      /** Whether to refetch data when window regains focus */
      refetchOnWindowFocus?: boolean;
    };
    /** Enable/disable specific operations */
    operations?: {
      /** Enable list operation */
      list?: boolean;
      /** Enable get operation */
      get?: boolean;
      /** Enable search operation */
      search?: boolean;
      /** Enable create operation */
      create?: boolean;
      /** Enable update operation */
      update?: boolean;
      /** Enable delete operation */
      delete?: boolean;
    };
  };

/**
 * Factory function to create EntityConfig from registry metadata.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @param schema - The Zod schema for the entity
 * @param metadata - The Query metadata configuration
 * @returns Complete EntityConfig for the entity
 *
 * @throws {Error} When transport type is not supported
 *
 * @example
 * ```typescript
 * const userConfig = createEntityConfigFromRegistry(userSchema, {
 *   title: 'user',
 *   transport: 'rest',
 *   baseEndpoint: '/api/users'
 * });
 * ```
 */
export function createEntityConfigFromRegistry<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  schema: z.ZodSchema<TEntity>,
  metadata: QueryMetadata<TEntity, TId>
): EntityConfig<TEntity, TId> {
  // Handle different transport types
  if (metadata.transport === "rest") {
    return createRestEntityConfig(schema, metadata);
  } else if (metadata.transport === "server-actions") {
    return createServerActionsEntityConfig(schema, metadata);
  } else {
    throw new Error(
      `Unsupported transport type: ${(metadata as any).transport}`
    );
  }
}

/**
 * Create EntityConfig for REST transport.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @param schema - The Zod schema for the entity
 * @param metadata - The Query metadata with REST transport configuration
 * @returns EntityConfig configured for REST operations
 */
function createRestEntityConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  schema: z.ZodSchema<TEntity>,
  metadata: QueryMetadata<TEntity, TId> & RestTransportConfig
): EntityConfig<TEntity, TId> {
  const entityName = metadata.title;
  const baseEndpoint = metadata.baseEndpoint;
  const fetchers = createRestFetchers<TEntity, TId>(
    baseEndpoint,
    metadata.fetchOptions
  );

  // Create entity metadata
  const entityMetadata: EntityMetadata<TEntity> = {
    name: entityName,
    version: "1.0.0",
    schema: {
      parse: (data: unknown) => schema.parse(data),
      safeParse: (data: unknown) => schema.safeParse(data),
    },
    operations: {
      canList: metadata.operations?.list ?? true,
      canGet: metadata.operations?.get ?? true,
      canSearch: metadata.operations?.search ?? true,
      canCreate: metadata.operations?.create ?? true,
      canUpdate: metadata.operations?.update ?? true,
      canDelete: metadata.operations?.delete ?? true,
    },
    endpoints: {
      base: baseEndpoint,
      list: metadata.endpoints?.list ?? baseEndpoint,
      get: metadata.endpoints?.get ?? `${baseEndpoint}/:id`,
      search: metadata.endpoints?.search ?? `${baseEndpoint}/search`,
      create: metadata.endpoints?.create ?? baseEndpoint,
      update: metadata.endpoints?.update ?? `${baseEndpoint}/:id`,
      delete: metadata.endpoints?.delete ?? `${baseEndpoint}/:id`,
    },
  };

  // Create query configurations
  const queries = {
    ...(metadata.operations?.list !== false && {
      list: {
        queryKey: (params: ListParams) => [entityName, "list", params],
        fetcher: fetchers.list,
        options: {
          staleTime: metadata.cacheConfig?.staleTime ?? 5 * 60 * 1000,
          gcTime: metadata.cacheConfig?.gcTime ?? 10 * 60 * 1000,
          refetchOnWindowFocus:
            metadata.cacheConfig?.refetchOnWindowFocus ?? false,
        },
      } as QueryConfig<ListResult<TEntity>, ListParams, EntityOperationError>,
    }),

    ...(metadata.operations?.get !== false && {
      get: {
        queryKey: (params: GetParams<TId>) => [entityName, "get", params.id],
        fetcher: fetchers.get,
        options: {
          staleTime: metadata.cacheConfig?.staleTime ?? 5 * 60 * 1000,
          gcTime: metadata.cacheConfig?.gcTime ?? 10 * 60 * 1000,
          refetchOnWindowFocus:
            metadata.cacheConfig?.refetchOnWindowFocus ?? false,
        },
      } as QueryConfig<TEntity, GetParams<TId>, EntityOperationError>,
    }),

    ...(metadata.operations?.search !== false && {
      search: {
        queryKey: (params: SearchParams) => [entityName, "search", params],
        fetcher: fetchers.search,
        options: {
          staleTime: 30 * 1000, // Search results stale faster
          gcTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
        },
      } as QueryConfig<
        SearchResult<TEntity>,
        SearchParams,
        EntityOperationError
      >,
    }),
  };

  // Create mutation configurations
  const mutations = {
    ...(metadata.operations?.create !== false && {
      create: {
        mutationKey: [entityName, "create"],
        mutationFn: fetchers.create,
        optimisticUpdate: (variables: CreateParams<TEntity>) =>
          ({
            ...variables.data,
            id: `temp-${Date.now()}` as TId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TEntity),
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        TEntity,
        CreateParams<TEntity>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),

    ...(metadata.operations?.update !== false && {
      update: {
        mutationKey: [entityName, "update"],
        mutationFn: fetchers.update,
        optimisticUpdate: (variables: UpdateParams<TEntity, TId>) =>
          ({
            ...variables.data,
            id: variables.id,
            updatedAt: new Date(),
          } as TEntity),
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        TEntity,
        UpdateParams<TEntity, TId>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),

    ...(metadata.operations?.delete !== false && {
      delete: {
        mutationKey: [entityName, "delete"],
        mutationFn: fetchers.delete,
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        void,
        DeleteParams<TId>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),
  };

  return {
    metadata: entityMetadata,
    queries,
    mutations,
  };
}

/**
 * Create EntityConfig for Server Actions transport.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @param schema - The Zod schema for the entity
 * @param metadata - The Query metadata with server actions transport configuration
 * @returns EntityConfig configured for server actions operations
 */
function createServerActionsEntityConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  schema: z.ZodSchema<TEntity>,
  metadata: QueryMetadata<TEntity, TId> &
    ServerActionsTransportConfig<TEntity, TId>
): EntityConfig<TEntity, TId> {
  const entityName = metadata.title || "entity";
  const { serverActions } = metadata;

  // Create entity metadata
  const entityMetadata: EntityMetadata<TEntity> = {
    name: entityName,
    version: "1.0.0",
    schema: {
      parse: (data: unknown) => schema.parse(data),
      safeParse: (data: unknown) => schema.safeParse(data),
    },
    operations: {
      canList: !!serverActions.list,
      canGet: !!serverActions.get,
      canSearch: !!serverActions.search,
      canCreate: !!serverActions.create,
      canUpdate: !!serverActions.update,
      canDelete: !!serverActions.delete,
    },
  };

  // Create query configurations using server actions
  const queries = {
    ...(serverActions.list && {
      list: {
        queryKey: (params: ListParams) => [entityName, "list", params],
        fetcher: serverActions.list,
        options: {
          staleTime: metadata.cacheConfig?.staleTime ?? 5 * 60 * 1000,
          gcTime: metadata.cacheConfig?.gcTime ?? 10 * 60 * 1000,
          refetchOnWindowFocus:
            metadata.cacheConfig?.refetchOnWindowFocus ?? false,
        },
      } as QueryConfig<ListResult<TEntity>, ListParams, EntityOperationError>,
    }),

    ...(serverActions.get && {
      get: {
        queryKey: (params: GetParams<TId>) => [entityName, "get", params.id],
        fetcher: serverActions.get,
        options: {
          staleTime: metadata.cacheConfig?.staleTime ?? 5 * 60 * 1000,
          gcTime: metadata.cacheConfig?.gcTime ?? 10 * 60 * 1000,
          refetchOnWindowFocus:
            metadata.cacheConfig?.refetchOnWindowFocus ?? false,
        },
      } as QueryConfig<TEntity, GetParams<TId>, EntityOperationError>,
    }),

    ...(serverActions.search && {
      search: {
        queryKey: (params: SearchParams) => [entityName, "search", params],
        fetcher: serverActions.search,
        options: {
          staleTime: 30 * 1000,
          gcTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
        },
      } as QueryConfig<
        SearchResult<TEntity>,
        SearchParams,
        EntityOperationError
      >,
    }),
  };

  // Create mutation configurations using server actions
  const mutations = {
    ...(serverActions.create && {
      create: {
        mutationKey: [entityName, "create"],
        mutationFn: serverActions.create,
        optimisticUpdate: (variables: CreateParams<TEntity>) =>
          ({
            ...variables.data,
            id: `temp-${Date.now()}` as TId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TEntity),
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        TEntity,
        CreateParams<TEntity>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),

    ...(serverActions.update && {
      update: {
        mutationKey: [entityName, "update"],
        mutationFn: serverActions.update,
        optimisticUpdate: (variables: UpdateParams<TEntity, TId>) =>
          ({
            ...variables.data,
            id: variables.id,
            updatedAt: new Date(),
          } as TEntity),
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        TEntity,
        UpdateParams<TEntity, TId>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),

    ...(serverActions.delete && {
      delete: {
        mutationKey: [entityName, "delete"],
        mutationFn: serverActions.delete,
        invalidates: [[entityName, "list"]],
      } as MutationConfig<
        void,
        DeleteParams<TId>,
        MutationContext<TEntity>,
        EntityOperationError
      >,
    }),
  };

  return {
    metadata: entityMetadata,
    queries,
    mutations,
  };
}

/**
 * Create the Query registry using the Zod registry system.
 * This follows the same pattern as formRegistry and tableRegistry.
 */
export const queryRegistry =
  createRegistry<QueryMetadata<BaseEntity, EntityId>>();

/**
 * Helper function to get Query metadata from a schema.
 *
 * @param schema - The Zod schema to retrieve metadata for
 * @returns The Query metadata if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const metadata = getQueryMetadata(userSchema);
 * if (metadata) {
 *   console.log(`Entity: ${metadata.title}`);
 * }
 * ```
 */
export function getQueryMetadata(
  schema: z.ZodSchema<any>
): QueryMetadata<any, any> | undefined {
  return queryRegistry.get(schema) as QueryMetadata<any, any> | undefined;
}

/**
 * Create EntityConfig on-demand from schema with Query metadata.
 * This follows the same pattern as form/table registries - no separate storage.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @param schema - The Zod schema with registered Query metadata
 * @returns Complete EntityConfig for the entity
 *
 * @throws {Error} When schema doesn't have Query metadata registered
 *
 * @example
 * ```typescript
 * // First register metadata
 * userSchema.register(queryRegistry, {
 *   title: 'user',
 *   transport: 'rest',
 *   baseEndpoint: '/api/users'
 * });
 *
 * // Then create config
 * const userConfig = createEntityConfigFromSchema(userSchema);
 * ```
 */
export function createEntityConfigFromSchema<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(schema: z.ZodSchema<TEntity>): EntityConfig<TEntity, TId> {
  const metadata = getQueryMetadata(schema);
  if (!metadata) {
    throw new Error(
      "Schema must have Query metadata registered. Use: schema.register(queryRegistry, metadata)"
    );
  }

  return createEntityConfigFromRegistry(schema, metadata) as EntityConfig<
    TEntity,
    TId
  >;
}
