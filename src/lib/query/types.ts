import type {
  UseQueryResult,
  UseMutationResult,
  QueryKey,
  MutationKey,
} from "@tanstack/react-query";

/**
 * Core entity identifier types with better constraint handling.
 *
 * @public
 */
export type EntityId = string | number;

/**
 * UUID string type with proper format validation.
 *
 * @public
 */
export type UUIDString = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Standardized timestamp fields for entities.
 *
 * @public
 */
export interface EntityTimestamps {
  /** The date and time when the entity was created */
  readonly createdAt: Date;
  /** The date and time when the entity was last updated */
  readonly updatedAt: Date;
}

/**
 * Base entity interface with flexible ID typing.
 *
 * @template TId - The entity ID type extending EntityId
 * @public
 */
export interface BaseEntity<TId extends EntityId = EntityId>
  extends EntityTimestamps {
  /** Unique identifier for the entity */
  readonly id: TId;
}

/**
 * Utility type that removes ID and timestamp fields from an entity.
 *
 * @template T - The entity type
 * @public
 */
export type EntityWithoutId<T> = Omit<T, keyof BaseEntity>;

/**
 * Utility type for entity creation that excludes generated fields.
 *
 * @template T - The entity type
 * @public
 */
export type EntityForCreate<T> = Omit<T, keyof BaseEntity>;

/**
 * Utility type for entity updates with partial fields.
 *
 * @template T - The entity type
 * @public
 */
export type EntityForUpdate<T> = Partial<Omit<T, keyof BaseEntity>>;

/**
 * Standard parameters for list operations with pagination and filtering.
 *
 * @public
 */
export type ListParams = {
  /** Page number for pagination (1-based) */
  readonly page?: number;
  /** Number of items per page */
  readonly limit?: number;
  /** Field name to sort by */
  readonly sort?: string;
  /** Sort order direction */
  readonly order?: "asc" | "desc";
  /** Additional filters to apply */
  readonly filters?: Record<string, unknown>;
};

/**
 * Parameters for getting a single entity by ID.
 *
 * @template TId - The entity ID type
 * @public
 */
export interface GetParams<TId extends EntityId = EntityId> {
  /** The entity ID to retrieve */
  readonly id: TId;
}

/**
 * Parameters for search operations.
 *
 * @public
 */
export type SearchParams = {
  /** Search query string */
  readonly query: string;
  /** Maximum number of results to return */
  readonly limit?: number;
  /** Additional filters to apply to search */
  readonly filters?: Record<string, unknown>;
};

/**
 * Parameters for creating a new entity.
 *
 * @template T - The entity type
 * @public
 */
export interface CreateParams<T> {
  /** The entity data to create */
  readonly data: EntityForCreate<T>;
}

/**
 * Parameters for updating an existing entity.
 *
 * @template T - The entity type
 * @template TId - The entity ID type
 * @public
 */
export interface UpdateParams<T, TId extends EntityId = EntityId> {
  /** The entity ID to update */
  readonly id: TId;
  /** The partial entity data to update */
  readonly data: EntityForUpdate<T>;
}

/**
 * Parameters for deleting an entity.
 *
 * @template TId - The entity ID type
 * @public
 */
export interface DeleteParams<TId extends EntityId = EntityId> {
  /** The entity ID to delete */
  readonly id: TId;
}

/**
 * Result type for list operations with pagination metadata.
 *
 * @template T - The entity type
 * @public
 */
export interface ListResult<T> {
  /** Array of entities */
  readonly data: readonly T[];
  /** Pagination and result metadata */
  readonly meta: {
    /** Total number of entities available */
    readonly total: number;
    /** Current page number */
    readonly page: number;
    /** Number of items per page */
    readonly limit: number;
    /** Whether there is a next page */
    readonly hasNext: boolean;
    /** Whether there is a previous page */
    readonly hasPrev: boolean;
  };
}

/**
 * Result type for search operations with search metadata.
 *
 * @template T - The entity type
 * @public
 */
export interface SearchResult<T> {
  /** Array of matching entities */
  readonly data: readonly T[];
  /** Search result metadata */
  readonly meta: {
    /** Total number of matching entities */
    readonly total: number;
    /** The search query that was executed */
    readonly query: string;
    /** Time taken to execute the search in milliseconds */
    readonly took: number;
  };
}

/**
 * Base error interface for entity operations.
 *
 * @public
 */
export interface EntityError {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Human-readable error message */
  readonly message: string;
  /** Additional error details */
  readonly details?: Record<string, unknown>;
  /** When the error occurred */
  readonly timestamp: Date;
}

/**
 * Validation error with field-specific messages.
 *
 * @public
 */
export interface ValidationError extends EntityError {
  /** Error code indicating validation failure */
  readonly code: "VALIDATION_ERROR";
  /** Field-specific validation error messages */
  readonly fields: Record<string, string[]>;
}

/**
 * Error for when an entity is not found.
 *
 * @public
 */
export interface NotFoundError extends EntityError {
  /** Error code indicating entity not found */
  readonly code: "NOT_FOUND";
  /** Type of entity that was not found */
  readonly entityType: string;
  /** ID of the entity that was not found */
  readonly entityId: EntityId;
}

/**
 * Error for when an operation conflicts with existing data.
 *
 * @public
 */
export interface ConflictError extends EntityError {
  /** Error code indicating a conflict */
  readonly code: "CONFLICT";
  /** Type of conflict that occurred */
  readonly conflictType: "DUPLICATE" | "VERSION" | "CONSTRAINT";
}

/**
 * Union type of all possible entity operation errors.
 *
 * @public
 */
export type EntityOperationError =
  | ValidationError
  | NotFoundError
  | ConflictError
  | EntityError;

/**
 * Context information for mutations with optimistic updates.
 *
 * @template T - The data type
 * @public
 */
export interface MutationContext<T = unknown> {
  /** Previous data before the mutation */
  readonly previousData?: T;
  /** Optimistic data during the mutation */
  readonly optimisticData?: T;
  /** When the mutation context was created */
  readonly timestamp: Date;
}

/**
 * Configuration for query operations with enhanced options.
 *
 * @template TData - The data type returned by the query
 * @template TParams - The parameters type for the query
 * @template TError - The error type for the query
 * @public
 */
export interface QueryConfig<
  TData,
  TParams = void,
  TError = EntityOperationError
> {
  /** Function to generate the query key */
  readonly queryKey: (params: TParams) => QueryKey;
  /** Function to fetch the data */
  readonly fetcher: (params: TParams) => Promise<TData>;
  /** Optional data transformation function */
  readonly transform?: (data: unknown) => TData;
  /** Additional query options */
  readonly options?: {
    /** Time in milliseconds that data is considered fresh */
    readonly staleTime?: number;
    /** Time in milliseconds that unused data stays in cache */
    readonly gcTime?: number;
    /** Whether to refetch when window regains focus */
    readonly refetchOnWindowFocus?: boolean;
    /** Whether the query is enabled */
    readonly enabled?: boolean;
    /** Retry configuration */
    readonly retry?:
      | number
      | ((failureCount: number, error: TError) => boolean);
    /** Delay between retries */
    readonly retryDelay?: number | ((retryAttempt: number) => number);
  };
}

/**
 * Configuration for mutation operations with enhanced lifecycle hooks.
 *
 * @template TData - The data type returned by the mutation
 * @template TVariables - The variables type for the mutation
 * @template TContext - The context type for the mutation
 * @template TError - The error type for the mutation
 * @public
 */
export interface MutationConfig<
  TData,
  TVariables,
  TContext = MutationContext<TData>,
  TError = EntityOperationError
> {
  /** Optional mutation key for identification */
  readonly mutationKey?: MutationKey;
  /** Function to execute the mutation */
  readonly mutationFn: (variables: TVariables) => Promise<TData>;
  /** Optional data transformation function */
  readonly transform?: (data: unknown) => TData;
  /** Query keys to invalidate after successful mutation */
  readonly invalidates?: QueryKey[];
  /** Function to generate optimistic update data */
  readonly optimisticUpdate?: (variables: TVariables) => TData | undefined;
  /** Called before mutation executes */
  readonly onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  /** Called when mutation succeeds */
  readonly onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext
  ) => void;
  /** Called when mutation fails */
  readonly onError?: (
    error: TError,
    variables: TVariables,
    context?: TContext
  ) => void;
  /** Called when mutation settles (success or error) */
  readonly onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context?: TContext
  ) => void;
}

/**
 * Configuration for server action operations with validation pipeline.
 *
 * @template TData - The data type returned by the server action
 * @template TVariables - The variables type for the server action
 * @template TContext - The context type for the server action
 * @template TError - The error type for the server action
 * @public
 */
export interface ServerActionConfig<
  TData,
  TVariables,
  TContext = MutationContext<TData>,
  TError = EntityOperationError
> extends Omit<
    MutationConfig<TData, TVariables, TContext, TError>,
    "mutationFn"
  > {
  /** Server action function to execute */
  readonly serverAction: (variables: TVariables) => Promise<TData>;
  /** Optional validation function */
  readonly validate?: (variables: TVariables) => Promise<void> | void;
  /** Optional input transformation function */
  readonly transformInput?: (variables: TVariables) => TVariables;
  /** Optional output transformation function */
  readonly transformOutput?: (data: TData) => TData;
}

/**
 * Entity schema definition with validation capabilities.
 *
 * @template T - The entity type
 * @public
 */
export interface EntitySchema<T> {
  /** Parse data and throw on validation error */
  readonly parse: (data: unknown) => T;
  /** Parse data and return result with success flag */
  readonly safeParse: (
    data: unknown
  ) => { success: true; data: T } | { success: false; error: unknown };
  /** Async parse data and throw on validation error */
  readonly parseAsync?: (data: unknown) => Promise<T>;
  /** Async parse data and return result with success flag */
  readonly safeParsehAsync?: (
    data: unknown
  ) => Promise<{ success: true; data: T } | { success: false; error: unknown }>;
}

/**
 * Hook result type for entity queries with consistent error handling.
 *
 * @template T - The data type
 * @template TError - The error type
 * @public
 */
export type EntityQueryResult<
  T,
  TError = EntityOperationError
> = UseQueryResult<T, TError>;

/**
 * Hook result type for entity mutations with consistent error handling.
 *
 * @template T - The data type
 * @template TVariables - The variables type
 * @template TContext - The context type
 * @template TError - The error type
 * @public
 */
export type EntityMutationResult<
  T,
  TVariables,
  TContext = MutationContext<T>,
  TError = EntityOperationError
> = UseMutationResult<T, TError, TVariables, TContext>;

/**
 * Hook result type for entity delete mutations.
 *
 * @template TEntity - The entity type
 * @template TId - The entity ID type
 * @template TError - The error type
 * @public
 */
export type EntityDeleteMutationResult<
  TEntity,
  TId extends EntityId = EntityId,
  TError = EntityOperationError
> = UseMutationResult<
  void,
  TError,
  DeleteParams<TId>,
  MutationContext<TEntity>
>;

/**
 * Flags indicating which operations are available for an entity.
 *
 * @public
 */
export interface OperationFlags {
  /** Whether list operations are supported */
  readonly canList: boolean;
  /** Whether get operations are supported */
  readonly canGet: boolean;
  /** Whether search operations are supported */
  readonly canSearch: boolean;
  /** Whether create operations are supported */
  readonly canCreate: boolean;
  /** Whether update operations are supported */
  readonly canUpdate: boolean;
  /** Whether delete operations are supported */
  readonly canDelete: boolean;
}

/**
 * Metadata for entity introspection and configuration.
 *
 * @template T - The entity type
 * @public
 */
export interface EntityMetadata<T> {
  /** Human-readable name of the entity */
  readonly name: string;
  /** Version of the entity schema */
  readonly version: string;
  /** Schema for validation and parsing */
  readonly schema: EntitySchema<T>;
  /** Available operations for this entity */
  readonly operations: OperationFlags;
  /** Optional API endpoint configuration */
  readonly endpoints?: {
    /** Base URL for the entity endpoints */
    readonly base: string;
    /** List endpoint path */
    readonly list?: string;
    /** Get endpoint path */
    readonly get?: string;
    /** Search endpoint path */
    readonly search?: string;
    /** Create endpoint path */
    readonly create?: string;
    /** Update endpoint path */
    readonly update?: string;
    /** Delete endpoint path */
    readonly delete?: string;
  };
}

/**
 * Type registry for custom queries that preserves specific types for each query.
 *
 * @public
 */
export interface CustomQueryRegistry {
  readonly [queryName: string]: {
    /** The data type returned by the query */
    readonly data: unknown;
    /** The parameters type for the query */
    readonly params: unknown;
  };
}

/**
 * Type registry for custom mutations that preserves specific types for each mutation.
 *
 * @public
 */
export interface CustomMutationRegistry {
  readonly [mutationName: string]: {
    /** The data type returned by the mutation */
    readonly data: unknown;
    /** The variables type for the mutation */
    readonly variables: unknown;
  };
}

/**
 * Type registry for custom server actions that preserves specific types for each action.
 *
 * @public
 */
export interface CustomServerActionRegistry {
  readonly [actionName: string]: {
    /** The data type returned by the server action */
    readonly data: unknown;
    /** The variables type for the server action */
    readonly variables: unknown;
  };
}

/**
 * Default empty registry for custom queries.
 *
 * @public
 */
export interface EmptyCustomQueryRegistry extends CustomQueryRegistry {}

/**
 * Default empty registry for custom mutations.
 *
 * @public
 */
export interface EmptyCustomMutationRegistry extends CustomMutationRegistry {}

/**
 * Default empty registry for custom server actions.
 *
 * @public
 */
export interface EmptyCustomServerActionRegistry
  extends CustomServerActionRegistry {}
