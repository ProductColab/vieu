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
  QueryConfig,
  MutationConfig,
  ServerActionConfig,
  EntityOperationError,
  MutationContext,
  CustomQueryRegistry,
  CustomMutationRegistry,
  CustomServerActionRegistry,
  EmptyCustomQueryRegistry,
  EmptyCustomMutationRegistry,
  EmptyCustomServerActionRegistry,
} from "./types";

/**
 * Comprehensive entity configuration with typed custom operation registries.
 *
 * Provides a complete configuration interface for entity operations including
 * queries, mutations, and server actions with full type safety.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @template TCustomQueries - Custom query registry type
 * @template TCustomMutations - Custom mutation registry type
 * @template TCustomServerActions - Custom server action registry type
 *
 * @example
 * ```typescript
 * const userConfig: EntityConfig<User, string> = {
 *   metadata: { name: 'user', schema: userSchema },
 *   queries: {
 *     list: { queryKey: ['users'], fetcher: fetchUsers }
 *   }
 * };
 * ```
 */
export interface EntityConfig<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId,
  TCustomQueries extends CustomQueryRegistry = EmptyCustomQueryRegistry,
  TCustomMutations extends CustomMutationRegistry = EmptyCustomMutationRegistry,
  TCustomServerActions extends CustomServerActionRegistry = EmptyCustomServerActionRegistry
> {
  /** Entity metadata including name, schema, and validation information */
  readonly metadata: EntityMetadata<TEntity>;

  /** Query configurations for data fetching operations */
  readonly queries?: {
    /** Configuration for listing entities with pagination */
    readonly list?: QueryConfig<
      ListResult<TEntity>,
      ListParams,
      EntityOperationError
    >;
    /** Configuration for fetching a single entity by ID */
    readonly get?: QueryConfig<TEntity, GetParams<TId>, EntityOperationError>;
    /** Configuration for searching entities with text queries */
    readonly search?: QueryConfig<
      SearchResult<TEntity>,
      SearchParams,
      EntityOperationError
    >;
    /** Custom query configurations defined by the registry */
    readonly custom?: {
      readonly [K in keyof TCustomQueries]: QueryConfig<
        TCustomQueries[K]["data"],
        TCustomQueries[K]["params"],
        EntityOperationError
      >;
    };
  };

  /** Mutation configurations for data modification operations */
  readonly mutations?: {
    /** Configuration for creating new entities */
    readonly create?: MutationConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Configuration for updating existing entities */
    readonly update?: MutationConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Configuration for deleting entities */
    readonly delete?: MutationConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Custom mutation configurations defined by the registry */
    readonly custom?: {
      readonly [K in keyof TCustomMutations]: MutationConfig<
        TCustomMutations[K]["data"],
        TCustomMutations[K]["variables"],
        MutationContext<TCustomMutations[K]["data"]>,
        EntityOperationError
      >;
    };
  };

  /** Server action configurations for Next.js server actions */
  readonly serverActions?: {
    /** Configuration for create server action */
    readonly create?: ServerActionConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Configuration for update server action */
    readonly update?: ServerActionConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Configuration for delete server action */
    readonly delete?: ServerActionConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >;
    /** Custom server action configurations defined by the registry */
    readonly custom?: {
      readonly [K in keyof TCustomServerActions]: ServerActionConfig<
        TCustomServerActions[K]["data"],
        TCustomServerActions[K]["variables"],
        MutationContext<TCustomServerActions[K]["data"]>,
        EntityOperationError
      >;
    };
  };
}

/**
 * Type-safe entity operations interface providing React hooks for entity management.
 *
 * Exposes all standard Query operations as React Query hooks with full type safety
 * and support for custom queries and mutations.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @template TCustomQueries - Custom query registry type
 * @template TCustomMutations - Custom mutation registry type
 *
 * @example
 * ```typescript
 * const userOps: EntityOperations<User, string> = useEntity(userSchema);
 * const { data: users } = userOps.useList();
 * const createUser = userOps.useCreate();
 * ```
 */
export interface EntityOperations<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId,
  TCustomQueries extends CustomQueryRegistry = EmptyCustomQueryRegistry,
  TCustomMutations extends CustomMutationRegistry = EmptyCustomMutationRegistry
> {
  /**
   * Hook for listing entities with optional pagination and filtering.
   *
   * @param params - Optional list parameters for pagination and filtering
   * @param options - Query options including enabled state
   * @returns React Query result for entity list
   */
  readonly useList: (
    params?: ListParams,
    options?: { enabled?: boolean }
  ) => import("./types").EntityQueryResult<ListResult<TEntity>>;

  /**
   * Hook for fetching a single entity by ID.
   *
   * @param id - The entity ID to fetch
   * @param options - Query options including enabled state
   * @returns React Query result for single entity
   */
  readonly useGet: (
    id: TId,
    options?: { enabled?: boolean }
  ) => import("./types").EntityQueryResult<TEntity>;

  /**
   * Hook for searching entities with text queries and optional filters.
   *
   * @param query - The search query string
   * @param options - Search options including enabled state and filters
   * @returns React Query result for search results
   */
  readonly useSearch: (
    query: string,
    options?: { enabled?: boolean; filters?: Record<string, unknown> }
  ) => import("./types").EntityQueryResult<SearchResult<TEntity>>;

  /**
   * Hook for creating new entities with optimistic updates.
   *
   * @returns React Query mutation for entity creation
   */
  readonly useCreate: () => import("./types").EntityMutationResult<
    TEntity,
    CreateParams<TEntity>
  >;

  /**
   * Hook for updating existing entities with optimistic updates.
   *
   * @returns React Query mutation for entity updates
   */
  readonly useUpdate: () => import("./types").EntityMutationResult<
    TEntity,
    UpdateParams<TEntity, TId>
  >;

  /**
   * Hook for deleting entities with cache invalidation.
   *
   * @returns React Query mutation for entity deletion
   */
  readonly useDelete: () => import("./types").EntityDeleteMutationResult<
    TEntity,
    TId
  >;

  /**
   * Hook for executing custom queries defined in the registry.
   *
   * @template K - The custom query key type
   * @param queryName - The name of the custom query
   * @param params - Parameters for the custom query
   * @param options - Query options including enabled state
   * @returns React Query result for custom query
   */
  readonly useCustomQuery: <K extends keyof TCustomQueries>(
    queryName: K,
    params?: TCustomQueries[K]["params"],
    options?: { enabled?: boolean }
  ) => import("./types").EntityQueryResult<TCustomQueries[K]["data"]>;

  /**
   * Hook for executing custom mutations defined in the registry.
   *
   * @template K - The custom mutation key type
   * @param mutationName - The name of the custom mutation
   * @returns React Query mutation for custom operation
   */
  readonly useCustomMutation: <K extends keyof TCustomMutations>(
    mutationName: K
  ) => import("./types").EntityMutationResult<
    TCustomMutations[K]["data"],
    TCustomMutations[K]["variables"]
  >;
}

/**
 * Server action specific operations interface for Next.js server actions.
 *
 * Extends EntityOperations but replaces standard mutations with server action
 * equivalents for server-side execution.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 *
 * @example
 * ```typescript
 * const userServerOps: ServerActionOperations<User, string> = useServerEntity(userSchema);
 * const createUser = userServerOps.useServerCreate();
 * ```
 */
export interface ServerActionOperations<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> extends Omit<
    EntityOperations<TEntity, TId>,
    "useCreate" | "useUpdate" | "useDelete"
  > {
  /**
   * Hook for creating entities via server actions.
   *
   * @returns React Query mutation using server action
   */
  readonly useServerCreate: () => import("./types").EntityMutationResult<
    TEntity,
    CreateParams<TEntity>
  >;

  /**
   * Hook for updating entities via server actions.
   *
   * @returns React Query mutation using server action
   */
  readonly useServerUpdate: () => import("./types").EntityMutationResult<
    TEntity,
    UpdateParams<TEntity, TId>
  >;

  /**
   * Hook for deleting entities via server actions.
   *
   * @returns React Query mutation using server action
   */
  readonly useServerDelete: () => import("./types").EntityMutationResult<
    void,
    DeleteParams<TId>
  >;

  /**
   * Hook for executing custom server actions.
   *
   * @template TData - The return data type
   * @template TVariables - The input variables type
   * @param actionName - The name of the server action
   * @returns React Query mutation for custom server action
   */
  readonly useCustomServerAction: <TData, TVariables = void>(
    actionName: string
  ) => import("./types").EntityMutationResult<TData, TVariables>;
}

/**
 * Factory interface for creating standardized REST API fetchers with enhanced error handling.
 *
 * Provides a consistent interface for all REST operations with proper error handling
 * and type safety.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 *
 * @example
 * ```typescript
 * const userFetchers: RestFetcherFactory<User, string> = createRestFetchers('/api/users');
 * const users = await userFetchers.list({ page: 1, limit: 10 });
 * ```
 */
export interface RestFetcherFactory<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId
> {
  /** Fetcher for listing entities with pagination */
  readonly list: (params?: ListParams) => Promise<ListResult<TEntity>>;

  /** Fetcher for getting a single entity by ID */
  readonly get: (params: GetParams<TId>) => Promise<TEntity>;

  /** Fetcher for searching entities */
  readonly search: (params: SearchParams) => Promise<SearchResult<TEntity>>;

  /** Fetcher for creating new entities */
  readonly create: (params: CreateParams<TEntity>) => Promise<TEntity>;

  /** Fetcher for updating existing entities */
  readonly update: (params: UpdateParams<TEntity, TId>) => Promise<TEntity>;

  /** Fetcher for deleting entities */
  readonly delete: (params: DeleteParams<TId>) => Promise<void>;
}

/**
 * Fluent API builder for creating entity configurations with method chaining.
 *
 * Provides a type-safe, fluent interface for building complex entity configurations
 * with full IntelliSense support.
 *
 * @template TEntity - The entity type extending BaseEntity
 * @template TId - The entity ID type extending EntityId
 * @template TCustomQueries - Custom query registry type
 * @template TCustomMutations - Custom mutation registry type
 * @template TCustomServerActions - Custom server action registry type
 *
 * @example
 * ```typescript
 * const config = createEntityConfig<User, string>()
 *   .withMetadata({ name: 'user', schema: userSchema })
 *   .withListQuery({ queryKey: ['users'], fetcher: fetchUsers })
 *   .build();
 * ```
 */
export interface EntityConfigBuilder<
  TEntity extends BaseEntity<TId>,
  TId extends EntityId = EntityId,
  TCustomQueries extends CustomQueryRegistry = EmptyCustomQueryRegistry,
  TCustomMutations extends CustomMutationRegistry = EmptyCustomMutationRegistry,
  TCustomServerActions extends CustomServerActionRegistry = EmptyCustomServerActionRegistry
> {
  /**
   * Sets the entity metadata including name and schema.
   *
   * @param metadata - The entity metadata configuration
   * @returns Builder instance for method chaining
   */
  readonly withMetadata: (
    metadata: EntityMetadata<TEntity>
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the list query for fetching multiple entities.
   *
   * @param config - The list query configuration
   * @returns Builder instance for method chaining
   */
  readonly withListQuery: (
    config: QueryConfig<ListResult<TEntity>, ListParams, EntityOperationError>
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the get query for fetching a single entity.
   *
   * @param config - The get query configuration
   * @returns Builder instance for method chaining
   */
  readonly withGetQuery: (
    config: QueryConfig<TEntity, GetParams<TId>, EntityOperationError>
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the search query for text-based entity searching.
   *
   * @param config - The search query configuration
   * @returns Builder instance for method chaining
   */
  readonly withSearchQuery: (
    config: QueryConfig<
      SearchResult<TEntity>,
      SearchParams,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the create mutation for entity creation.
   *
   * @param config - The create mutation configuration
   * @returns Builder instance for method chaining
   */
  readonly withCreateMutation: (
    config: MutationConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the update mutation for entity modification.
   *
   * @param config - The update mutation configuration
   * @returns Builder instance for method chaining
   */
  readonly withUpdateMutation: (
    config: MutationConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the delete mutation for entity removal.
   *
   * @param config - The delete mutation configuration
   * @returns Builder instance for method chaining
   */
  readonly withDeleteMutation: (
    config: MutationConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the create server action for entity creation.
   *
   * @param config - The create server action configuration
   * @returns Builder instance for method chaining
   */
  readonly withCreateServerAction: (
    config: ServerActionConfig<
      TEntity,
      CreateParams<TEntity>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the update server action for entity modification.
   *
   * @param config - The update server action configuration
   * @returns Builder instance for method chaining
   */
  readonly withUpdateServerAction: (
    config: ServerActionConfig<
      TEntity,
      UpdateParams<TEntity, TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Configures the delete server action for entity removal.
   *
   * @param config - The delete server action configuration
   * @returns Builder instance for method chaining
   */
  readonly withDeleteServerAction: (
    config: ServerActionConfig<
      void,
      DeleteParams<TId>,
      MutationContext<TEntity>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Adds a custom query to the entity configuration.
   *
   * @template TData - The query result data type
   * @template TParams - The query parameters type
   * @param name - The unique name for the custom query
   * @param config - The custom query configuration
   * @returns Builder instance with extended custom query registry
   */
  readonly withCustomQuery: <TData, TParams = void>(
    name: string,
    config: QueryConfig<TData, TParams, EntityOperationError>
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries & { [K in typeof name]: { data: TData; params: TParams } },
    TCustomMutations,
    TCustomServerActions
  >;

  /**
   * Adds a custom mutation to the entity configuration.
   *
   * @template TData - The mutation result data type
   * @template TVariables - The mutation variables type
   * @param name - The unique name for the custom mutation
   * @param config - The custom mutation configuration
   * @returns Builder instance with extended custom mutation registry
   */
  readonly withCustomMutation: <TData, TVariables = void>(
    name: string,
    config: MutationConfig<
      TData,
      TVariables,
      MutationContext<TData>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations & {
      [K in typeof name]: { data: TData; variables: TVariables };
    },
    TCustomServerActions
  >;

  /**
   * Adds a custom server action to the entity configuration.
   *
   * @template TData - The server action result data type
   * @template TVariables - The server action variables type
   * @param name - The unique name for the custom server action
   * @param config - The custom server action configuration
   * @returns Builder instance with extended custom server action registry
   */
  readonly withCustomServerAction: <TData, TVariables = void>(
    name: string,
    config: ServerActionConfig<
      TData,
      TVariables,
      MutationContext<TData>,
      EntityOperationError
    >
  ) => EntityConfigBuilder<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions & {
      [K in typeof name]: { data: TData; variables: TVariables };
    }
  >;

  /**
   * Builds the final entity configuration from the accumulated settings.
   *
   * @returns The complete entity configuration
   */
  readonly build: () => EntityConfig<
    TEntity,
    TId,
    TCustomQueries,
    TCustomMutations,
    TCustomServerActions
  >;
}

/**
 * Utility type for extracting the entity type from an EntityConfig.
 *
 * @template T - The EntityConfig type
 *
 * @example
 * ```typescript
 * type User = EntityFromConfig<typeof userConfig>; // User type
 * ```
 */
export type EntityFromConfig<T> = T extends EntityConfig<infer U, any>
  ? U
  : never;

/**
 * Utility type for extracting the ID type from an EntityConfig.
 *
 * @template T - The EntityConfig type
 *
 * @example
 * ```typescript
 * type UserId = IdFromConfig<typeof userConfig>; // string | number
 * ```
 */
export type IdFromConfig<T> = T extends EntityConfig<any, infer U> ? U : never;

/**
 * Validation adapter interface for integrating different schema validation libraries.
 *
 * Provides a consistent interface for schema validation that can be implemented
 * by different validation libraries (Zod, Yup, Joi, etc.).
 *
 * @template T - The validated data type
 *
 * @example
 * ```typescript
 * const zodAdapter: ValidationAdapter<User> = {
 *   parse: (data) => userSchema.parse(data),
 *   safeParse: (data) => userSchema.safeParse(data)
 * };
 * ```
 */
export interface ValidationAdapter<T> {
  /** Synchronously parse and validate data, throwing on validation errors */
  readonly parse: (data: unknown) => T;

  /** Safely parse data returning success/error result without throwing */
  readonly safeParse: (
    data: unknown
  ) => { success: true; data: T } | { success: false; error: unknown };

  /** Asynchronously parse and validate data, throwing on validation errors */
  readonly parseAsync?: (data: unknown) => Promise<T>;

  /** Safely parse data asynchronously returning success/error result */
  readonly safeParsehAsync?: (
    data: unknown
  ) => Promise<{ success: true; data: T } | { success: false; error: unknown }>;
}
