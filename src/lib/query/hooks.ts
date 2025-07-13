import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  EntityId,
  BaseEntity,
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
  ServerActionConfig,
  EntityMetadata,
} from "./types";
import type {
  EntityConfig,
  EntityOperations,
  RestFetcherFactory,
  EntityConfigBuilder,
} from "./config";
import { createEntityConfigFromSchema } from "./query.registry";

/**
 * Hook for querying a list of entities with enhanced error handling and caching.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing query settings
 * @param params - Optional list parameters for filtering, sorting, pagination
 * @param options - Optional query options including enabled flag
 * @returns React Query result for entity list
 *
 * @throws {Error} When list query is not configured for the entity
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useEntityList(userConfig, {
 *   page: 1,
 *   limit: 10,
 *   sort: 'name'
 * });
 * ```
 */
export function useEntityList<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  config: EntityConfig<TEntity, TId>,
  params?: ListParams,
  options?: { enabled?: boolean }
) {
  const queryConfig = config.queries?.list;
  if (!queryConfig) {
    throw new Error(
      `List query not configured for entity: ${config.metadata.name}`
    );
  }

  const safeParams = params || {};

  return useQuery({
    queryKey: queryConfig.queryKey(safeParams),
    queryFn: () => queryConfig.fetcher(safeParams),
    staleTime: queryConfig.options?.staleTime ?? 5 * 60 * 1000,
    gcTime: queryConfig.options?.gcTime ?? 10 * 60 * 1000,
    enabled: options?.enabled ?? queryConfig.options?.enabled,
    retry: queryConfig.options?.retry ?? 3,
    retryDelay:
      queryConfig.options?.retryDelay ??
      ((attempt) => Math.min(1000 * 2 ** attempt, 30000)),
    ...queryConfig.options,
    select: queryConfig.transform,
  });
}

/**
 * Hook for querying a single entity by ID with enhanced error handling and caching.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing query settings
 * @param id - The entity ID to fetch
 * @param options - Optional query options including enabled flag
 * @returns React Query result for single entity
 *
 * @throws {Error} When get query is not configured for the entity
 *
 * @example
 * ```typescript
 * const { data: user, isLoading } = useEntityGet(userConfig, userId);
 * ```
 */
export function useEntityGet<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  config: EntityConfig<TEntity, TId>,
  id: TId,
  options?: { enabled?: boolean }
) {
  const queryConfig = config.queries?.get;
  if (!queryConfig) {
    throw new Error(
      `Get query not configured for entity: ${config.metadata.name}`
    );
  }

  const params: GetParams<TId> = { id };

  return useQuery({
    queryKey: queryConfig.queryKey(params),
    queryFn: () => queryConfig.fetcher(params),
    staleTime: queryConfig.options?.staleTime ?? 5 * 60 * 1000,
    gcTime: queryConfig.options?.gcTime ?? 10 * 60 * 1000,
    enabled: (options?.enabled ?? queryConfig.options?.enabled) && !!id,
    retry: queryConfig.options?.retry ?? 3,
    retryDelay:
      queryConfig.options?.retryDelay ??
      ((attempt) => Math.min(1000 * 2 ** attempt, 30000)),
    ...queryConfig.options,
    select: queryConfig.transform,
  });
}

/**
 * Hook for searching entities with text query and optional filters.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing search query settings
 * @param query - Search query string
 * @param options - Optional search options including enabled flag and filters
 * @returns React Query result for search results
 *
 * @throws {Error} When search query is not configured for the entity
 *
 * @example
 * ```typescript
 * const { data: results } = useEntitySearch(userConfig, 'john', {
 *   filters: { active: true },
 *   enabled: query.length > 2
 * });
 * ```
 */
export function useEntitySearch<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  config: EntityConfig<TEntity, TId>,
  query: string,
  options?: { enabled?: boolean; filters?: Record<string, unknown> }
) {
  const queryConfig = config.queries?.search;
  if (!queryConfig) {
    throw new Error(
      `Search query not configured for entity: ${config.metadata.name}`
    );
  }

  const params: SearchParams = {
    query,
    filters: options?.filters,
  };

  return useQuery({
    queryKey: queryConfig.queryKey(params),
    queryFn: () => queryConfig.fetcher(params),
    staleTime: queryConfig.options?.staleTime ?? 30 * 1000,
    gcTime: queryConfig.options?.gcTime ?? 5 * 60 * 1000,
    enabled:
      (options?.enabled ?? queryConfig.options?.enabled) && query.length > 0,
    retry: queryConfig.options?.retry ?? 2,
    retryDelay:
      queryConfig.options?.retryDelay ??
      ((attempt) => Math.min(500 * 2 ** attempt, 15000)),
    ...queryConfig.options,
    select: queryConfig.transform,
  });
}

/**
 * Hook for creating new entities with optimistic updates and enhanced error handling.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing create mutation settings
 * @returns React Query mutation for creating entities
 *
 * @throws {Error} When create mutation is not configured for the entity
 *
 * @example
 * ```typescript
 * const createUser = useEntityCreate(userConfig);
 *
 * const handleCreate = () => {
 *   createUser.mutate({
 *     data: { name: 'John Doe', email: 'john@example.com' }
 *   });
 * };
 * ```
 */
export function useEntityCreate<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(config: EntityConfig<TEntity, TId>) {
  const queryClient = useQueryClient();
  const mutationConfig = config.mutations?.create;

  if (!mutationConfig) {
    throw new Error(
      `Create mutation not configured for entity: ${config.metadata.name}`
    );
  }

  return useMutation({
    mutationKey: mutationConfig.mutationKey,
    mutationFn: mutationConfig.mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [config.metadata.name, "list"],
      });

      // Snapshot previous values for rollback
      const previousListData = queryClient.getQueryData<ListResult<TEntity>>([
        config.metadata.name,
        "list",
      ]);

      // Optimistic update
      if (mutationConfig.optimisticUpdate) {
        const optimisticData = mutationConfig.optimisticUpdate(variables);
        if (optimisticData) {
          queryClient.setQueryData(
            [config.metadata.name, "list"],
            (old: ListResult<TEntity> | undefined) => {
              if (!old) return old;
              return {
                ...old,
                data: [...old.data, optimisticData],
                meta: {
                  ...old.meta,
                  total: old.meta.total + 1,
                },
              };
            }
          );
        }
      }

      // Internal context for cache management
      const internalContext = {
        previousListData,
        timestamp: new Date(),
      };

      // Mutation config context (what the user expects)
      const mutationContext: MutationContext<TEntity> = {
        previousData: undefined, // For create operations, there's no previous entity data
        optimisticData: mutationConfig.optimisticUpdate?.(variables),
        timestamp: new Date(),
      };

      // Store internal context for error handling
      (mutationContext as any).__internal = internalContext;

      return mutationConfig.onMutate
        ? await mutationConfig.onMutate(variables)
        : mutationContext;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch list queries
      queryClient.invalidateQueries({
        queryKey: [config.metadata.name, "list"],
      });

      // Set individual item cache
      queryClient.setQueryData([config.metadata.name, "get", data.id], data);

      // Custom invalidations
      if (mutationConfig.invalidates) {
        mutationConfig.invalidates.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Custom success handler
      mutationConfig.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update using internal context
      const internalContext = (context as any)?.__internal;
      if (internalContext?.previousListData) {
        queryClient.setQueryData(
          [config.metadata.name, "list"],
          internalContext.previousListData
        );
      }

      mutationConfig.onError?.(error, variables, context);
    },
    onSettled: mutationConfig.onSettled,
  });
}

/**
 * Hook for updating existing entities with optimistic updates and enhanced error handling.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing update mutation settings
 * @returns React Query mutation for updating entities
 *
 * @throws {Error} When update mutation is not configured for the entity
 *
 * @example
 * ```typescript
 * const updateUser = useEntityUpdate(userConfig);
 *
 * const handleUpdate = (userId: string) => {
 *   updateUser.mutate({
 *     id: userId,
 *     data: { name: 'Jane Doe' }
 *   });
 * };
 * ```
 */
export function useEntityUpdate<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(config: EntityConfig<TEntity, TId>) {
  const queryClient = useQueryClient();
  const mutationConfig = config.mutations?.update;

  if (!mutationConfig) {
    throw new Error(
      `Update mutation not configured for entity: ${config.metadata.name}`
    );
  }

  return useMutation({
    mutationKey: mutationConfig.mutationKey,
    mutationFn: mutationConfig.mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [config.metadata.name, "get", variables.id],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TEntity>([
        config.metadata.name,
        "get",
        variables.id,
      ]);

      // Optimistic update
      if (mutationConfig.optimisticUpdate) {
        const optimisticData = mutationConfig.optimisticUpdate(variables);
        if (optimisticData) {
          queryClient.setQueryData(
            [config.metadata.name, "get", variables.id],
            optimisticData
          );
        }
      }

      const context: MutationContext<TEntity> = {
        previousData,
        optimisticData: mutationConfig.optimisticUpdate?.(variables),
        timestamp: new Date(),
      };

      return mutationConfig.onMutate
        ? await mutationConfig.onMutate(variables)
        : context;
    },
    onSuccess: (data, variables, context) => {
      // Update specific item cache
      queryClient.setQueryData(
        [config.metadata.name, "get", variables.id],
        data
      );

      // Update item in list cache
      queryClient.setQueryData(
        [config.metadata.name, "list"],
        (old: ListResult<TEntity> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === variables.id ? data : item
            ),
          };
        }
      );

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: [config.metadata.name, "list"],
      });

      // Custom invalidations
      if (mutationConfig.invalidates) {
        mutationConfig.invalidates.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      mutationConfig.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          [config.metadata.name, "get", variables.id],
          context.previousData
        );
      }

      mutationConfig.onError?.(error, variables, context);
    },
    onSettled: mutationConfig.onSettled,
  });
}

/**
 * Hook for deleting entities with optimistic updates and enhanced error handling.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing delete mutation settings
 * @returns React Query mutation for deleting entities
 *
 * @throws {Error} When delete mutation is not configured for the entity
 *
 * @example
 * ```typescript
 * const deleteUser = useEntityDelete(userConfig);
 *
 * const handleDelete = (userId: string) => {
 *   deleteUser.mutate({ id: userId });
 * };
 * ```
 */
export function useEntityDelete<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(config: EntityConfig<TEntity, TId>) {
  const queryClient = useQueryClient();
  const mutationConfig = config.mutations?.delete;

  if (!mutationConfig) {
    throw new Error(
      `Delete mutation not configured for entity: ${config.metadata.name}`
    );
  }

  return useMutation({
    mutationKey: mutationConfig.mutationKey,
    mutationFn: mutationConfig.mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [config.metadata.name, "get", variables.id],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TEntity>([
        config.metadata.name,
        "get",
        variables.id,
      ]);

      // Optimistic update - remove from list
      queryClient.setQueryData(
        [config.metadata.name, "list"],
        (old: ListResult<TEntity> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((item) => item.id !== variables.id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      const context: MutationContext<TEntity> = {
        previousData,
        timestamp: new Date(),
      };

      return mutationConfig.onMutate
        ? await mutationConfig.onMutate(variables)
        : context;
    },
    onSuccess: (data, variables, context) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: [config.metadata.name, "get", variables.id],
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: [config.metadata.name, "list"],
      });

      // Custom invalidations
      if (mutationConfig.invalidates) {
        mutationConfig.invalidates.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      mutationConfig.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          [config.metadata.name, "get", variables.id],
          context.previousData
        );
        queryClient.invalidateQueries({
          queryKey: [config.metadata.name, "list"],
        });
      }

      mutationConfig.onError?.(error, variables, context);
    },
    onSettled: mutationConfig.onSettled,
  });
}

/**
 * Hook for server action-based entity creation with enhanced validation pipeline.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param config - Entity configuration containing server action settings
 * @returns React Query mutation for server action-based creation
 *
 * @throws {Error} When create server action is not configured for the entity
 *
 * @example
 * ```typescript
 * const createUserAction = useServerActionCreate(userConfig);
 *
 * const handleCreate = async () => {
 *   await createUserAction.mutateAsync({
 *     data: { name: 'John Doe', email: 'john@example.com' }
 *   });
 * };
 * ```
 */
export function useServerActionCreate<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(config: EntityConfig<TEntity, TId>) {
  const queryClient = useQueryClient();
  const actionConfig = config.serverActions?.create;

  if (!actionConfig) {
    throw new Error(
      `Create server action not configured for entity: ${config.metadata.name}`
    );
  }

  return useMutation({
    mutationKey: actionConfig.mutationKey,
    mutationFn: async (variables: CreateParams<TEntity>) => {
      // Validation pipeline
      if (actionConfig.validate) {
        await actionConfig.validate(variables);
      }

      // Schema validation
      if (config.metadata.schema) {
        config.metadata.schema.parse(variables.data);
      }

      // Transform input
      const transformedVariables = actionConfig.transformInput
        ? actionConfig.transformInput(variables)
        : variables;

      // Execute server action
      const result = await actionConfig.serverAction(transformedVariables);

      // Transform output
      return actionConfig.transformOutput
        ? actionConfig.transformOutput(result)
        : result;
    },
    onMutate: actionConfig.onMutate,
    onSuccess: (data, variables, context) => {
      // Standard cache updates
      queryClient.invalidateQueries({
        queryKey: [config.metadata.name, "list"],
      });
      queryClient.setQueryData([config.metadata.name, "get", data.id], data);

      // Custom invalidations
      if (actionConfig.invalidates) {
        actionConfig.invalidates.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      actionConfig.onSuccess?.(data, variables, context);
    },
    onError: actionConfig.onError,
    onSettled: actionConfig.onSettled,
  });
}

/**
 * Main entity operations factory that creates a complete set of hooks from a Zod schema.
 * This is the primary entry point for entity operations, similar to SchemaForm/SchemaTable.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @template TCustomQueries - Registry of custom query operations
 * @template TCustomMutations - Registry of custom mutation operations
 * @param schema - Zod schema defining the entity structure
 * @returns Complete set of entity operation hooks
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   createdAt: z.date(),
 *   updatedAt: z.date()
 * });
 *
 * const userOps = useEntity(userSchema);
 *
 * // Use the generated hooks
 * const { data: users } = userOps.useList();
 * const { data: user } = userOps.useGet(userId);
 * const createUser = userOps.useCreate();
 * ```
 */
export function useEntity<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId,
  TCustomQueries extends import("./types").CustomQueryRegistry = import("./types").EmptyCustomQueryRegistry,
  TCustomMutations extends import("./types").CustomMutationRegistry = import("./types").EmptyCustomMutationRegistry
>(
  schema: import("zod").ZodSchema<TEntity>
): EntityOperations<TEntity, TId, TCustomQueries, TCustomMutations> {
  const config = createEntityConfigFromSchema(schema) as EntityConfig<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations
  >;
  return {
    useList: (params?: ListParams, options?: { enabled?: boolean }) =>
      useEntityList(config, params, options),

    useGet: (id: TId, options?: { enabled?: boolean }) =>
      useEntityGet(config, id, options),

    useSearch: (
      query: string,
      options?: { enabled?: boolean; filters?: Record<string, unknown> }
    ) => useEntitySearch(config, query, options),

    useCreate: () => useEntityCreate(config),
    useUpdate: () => useEntityUpdate(config),
    useDelete: () => useEntityDelete(config),

    useCustomQuery: <K extends keyof TCustomQueries>(
      queryName: K,
      params?: TCustomQueries[K]["params"],
      options?: { enabled?: boolean }
    ) => {
      const queryConfig = config.queries?.custom?.[queryName as string];
      if (!queryConfig) {
        throw new Error(
          `Custom query '${String(queryName)}' not configured for entity: ${
            config.metadata.name
          }`
        );
      }

      return useQuery<TCustomQueries[K]["data"], EntityOperationError>({
        queryKey: queryConfig.queryKey(params),
        queryFn: () => queryConfig.fetcher(params),
        enabled: options?.enabled ?? queryConfig.options?.enabled,
        ...queryConfig.options,
        select: queryConfig.transform,
      });
    },

    useCustomMutation: <K extends keyof TCustomMutations>(mutationName: K) => {
      const mutationConfig = config.mutations?.custom?.[mutationName as string];
      if (!mutationConfig) {
        throw new Error(
          `Custom mutation '${String(
            mutationName
          )}' not configured for entity: ${config.metadata.name}`
        );
      }

      return useMutation<
        TCustomMutations[K]["data"],
        EntityOperationError,
        TCustomMutations[K]["variables"],
        MutationContext<TCustomMutations[K]["data"]>
      >({
        mutationKey: mutationConfig.mutationKey,
        mutationFn: mutationConfig.mutationFn,
        onMutate: mutationConfig.onMutate,
        onSuccess: mutationConfig.onSuccess,
        onError: mutationConfig.onError,
        onSettled: mutationConfig.onSettled,
      });
    },
  };
}

/**
 * Factory function for creating REST API fetchers with enhanced error handling.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param baseUrl - Base URL for the REST API endpoint
 * @param defaultOptions - Default fetch options to apply to all requests
 * @returns Object containing all REST operation fetchers
 *
 * @example
 * ```typescript
 * const userFetchers = createRestFetchers<User, string>(
 *   '/api/users',
 *   {
 *     headers: {
 *       'Authorization': `Bearer ${token}`,
 *       'Content-Type': 'application/json'
 *     }
 *   }
 * );
 *
 * // Use with entity config
 * const userConfig = createEntityConfig<User, string>('users')
 *   .withListQuery({
 *     queryKey: (params) => ['users', 'list', params],
 *     fetcher: userFetchers.list
 *   })
 *   .build();
 * ```
 */
export function createRestFetchers<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(
  baseUrl: string,
  defaultOptions?: RequestInit
): RestFetcherFactory<TEntity, TId> {
  const fetchWithDefaults = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const error: EntityOperationError = {
        code: `HTTP_${response.status}`,
        message: response.statusText,
        timestamp: new Date(),
      };
      throw error;
    }

    return response.json();
  };

  const createUrlParams = (params?: Record<string, unknown>): string => {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const paramString = searchParams.toString();
    return paramString ? `?${paramString}` : "";
  };

  return {
    list: (params?: ListParams) =>
      fetchWithDefaults(
        `${baseUrl}${createUrlParams(params as Record<string, unknown>)}`
      ),

    get: (params: GetParams<TId>) =>
      fetchWithDefaults(`${baseUrl}/${params.id}`),

    search: (params: SearchParams) =>
      fetchWithDefaults(`${baseUrl}/search${createUrlParams(params)}`),

    create: (params: CreateParams<TEntity>) =>
      fetchWithDefaults(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.data),
      }),

    update: (params: UpdateParams<TEntity, TId>) =>
      fetchWithDefaults(`${baseUrl}/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.data),
      }),

    delete: (params: DeleteParams<TId>) =>
      fetchWithDefaults(`${baseUrl}/${params.id}`, {
        method: "DELETE",
      }),
  };
}

/**
 * Mutable version of EntityConfig for builder pattern implementation.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 */
type MutableEntityConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> = {
  metadata?: EntityMetadata<TEntity>;
  queries?: {
    list?: QueryConfig<ListResult<TEntity>, ListParams, EntityOperationError>;
    get?: QueryConfig<TEntity, GetParams<TId>, EntityOperationError>;
    search?: QueryConfig<
      SearchResult<TEntity>,
      SearchParams,
      EntityOperationError
    >;
    custom?: Record<string, QueryConfig<any, any, EntityOperationError>>;
  };
  mutations?: {
    create?: MutationConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    update?: MutationConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    delete?: MutationConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    custom?: Record<
      string,
      MutationConfig<any, any, MutationContext<any>, EntityOperationError>
    >;
  };
  serverActions?: {
    create?: ServerActionConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    update?: ServerActionConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    delete?: ServerActionConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    custom?: Record<
      string,
      ServerActionConfig<any, any, MutationContext<any>, EntityOperationError>
    >;
  };
};

/**
 * Entity configuration builder for fluent API construction of entity configs.
 * Provides a chainable interface for building complex entity configurations.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type
 * @param _name - Entity name for identification (currently unused but reserved)
 * @returns EntityConfigBuilder instance for chaining configuration methods
 *
 * @example
 * ```typescript
 * const userConfig = createEntityConfig<User, string>('users')
 *   .withMetadata({
 *     name: 'users',
 *     displayName: 'Users',
 *     schema: userSchema
 *   })
 *   .withListQuery({
 *     queryKey: (params) => ['users', 'list', params],
 *     fetcher: userFetchers.list
 *   })
 *   .withCreateMutation({
 *     mutationKey: ['users', 'create'],
 *     mutationFn: userFetchers.create,
 *     optimisticUpdate: (variables) => ({
 *       ...variables.data,
 *       id: 'temp-' + Date.now(),
 *       createdAt: new Date(),
 *       updatedAt: new Date()
 *     })
 *   })
 *   .build();
 * ```
 */
export function createEntityConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
>(_name: string): EntityConfigBuilder<TEntity, TId> {
  let config: MutableEntityConfig<TEntity, TId> = {};

  const builder: EntityConfigBuilder<TEntity, TId> = {
    withMetadata: (metadata) => {
      config.metadata = metadata;
      return builder;
    },

    withListQuery: (queryConfig) => {
      config.queries = { ...config.queries, list: queryConfig };
      return builder;
    },

    withGetQuery: (queryConfig) => {
      config.queries = { ...config.queries, get: queryConfig };
      return builder;
    },

    withSearchQuery: (queryConfig) => {
      config.queries = { ...config.queries, search: queryConfig };
      return builder;
    },

    withCreateMutation: (mutationConfig) => {
      config.mutations = { ...config.mutations, create: mutationConfig };
      return builder;
    },

    withUpdateMutation: (mutationConfig) => {
      config.mutations = { ...config.mutations, update: mutationConfig };
      return builder;
    },

    withDeleteMutation: (mutationConfig) => {
      config.mutations = { ...config.mutations, delete: mutationConfig };
      return builder;
    },

    withCreateServerAction: (actionConfig) => {
      config.serverActions = { ...config.serverActions, create: actionConfig };
      return builder;
    },

    withUpdateServerAction: (actionConfig) => {
      config.serverActions = { ...config.serverActions, update: actionConfig };
      return builder;
    },

    withDeleteServerAction: (actionConfig) => {
      config.serverActions = { ...config.serverActions, delete: actionConfig };
      return builder;
    },

    withCustomQuery: <TData, TParams = void>(
      name: string,
      queryConfig: QueryConfig<TData, TParams, EntityOperationError>
    ) => {
      config.queries = {
        ...config.queries,
        custom: { ...config.queries?.custom, [name]: queryConfig },
      };
      return builder as any; // Type assertion needed for registry type evolution
    },

    withCustomMutation: <TData, TVariables = void>(
      name: string,
      mutationConfig: MutationConfig<
        TData,
        TVariables,
        MutationContext<TData>,
        EntityOperationError
      >
    ) => {
      config.mutations = {
        ...config.mutations,
        custom: { ...config.mutations?.custom, [name]: mutationConfig },
      };
      return builder as any; // Type assertion needed for registry type evolution
    },

    withCustomServerAction: <TData, TVariables = void>(
      name: string,
      actionConfig: ServerActionConfig<
        TData,
        TVariables,
        MutationContext<TData>,
        EntityOperationError
      >
    ) => {
      config.serverActions = {
        ...config.serverActions,
        custom: { ...config.serverActions?.custom, [name]: actionConfig },
      };
      return builder as any; // Type assertion needed for registry type evolution
    },

    build: () => {
      if (!config.metadata) {
        throw new Error("Entity metadata is required");
      }
      return config as EntityConfig<TEntity, TId>;
    },
  };

  return builder;
}
