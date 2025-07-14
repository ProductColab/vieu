import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { createRegistry, type BaseMetadata } from "./base.registry";
import type { ViewOption } from "./base.registry";

/**
 * Configuration for loading async options
 */
export interface AsyncOptionsConfig {
  /** Query key for caching */
  queryKey: string[];
  /** Function to fetch options */
  fetcher: (params?: Record<string, unknown>) => Promise<ViewOption[]>;
  /** Optional parameters to pass to fetcher */
  params?: Record<string, unknown>;
  /** Cache configuration */
  cacheConfig?: {
    /** Time in milliseconds that data is considered fresh */
    staleTime?: number;
    /** Time in milliseconds that unused data stays in cache */
    gcTime?: number;
    /** Whether to refetch when window regains focus */
    refetchOnWindowFocus?: boolean;
  };
  /** Whether the query should be enabled */
  enabled?: boolean;
  /** Transform function to convert fetched data to ViewOption format */
  transform?: (data: unknown) => ViewOption[];
}

/**
 * Options query metadata that can be registered on schemas
 */
export type OptionsQueryMetadata = BaseMetadata & {
  /** Configuration for async options loading */
  asyncOptions?: AsyncOptionsConfig;
  /** Fallback static options (used while loading or on error) */
  staticOptions?: ViewOption[];
};

/**
 * Registry for options query metadata
 */
export const optionsQueryRegistry = createRegistry<OptionsQueryMetadata>();

/**
 * Hook to get options for a schema, handling both static and async cases
 */
export function useSchemaOptions(
  schema: z.ZodType,
  staticOptions?: ViewOption[]
): {
  options: ViewOption[];
  isLoading: boolean;
  error: Error | null;
} {
  // Check if schema has async options metadata
  const metadata = optionsQueryRegistry.get(schema);

  // If no async config, return static options
  if (!metadata?.asyncOptions) {
    return {
      options: staticOptions || [],
      isLoading: false,
      error: null,
    };
  }

  const { asyncOptions } = metadata;

  // Use React Query to fetch async options
  const {
    data: fetchedOptions,
    isLoading,
    error,
  } = useQuery({
    queryKey: asyncOptions.queryKey,
    queryFn: async () => {
      const result = await asyncOptions.fetcher(asyncOptions.params);
      return asyncOptions.transform ? asyncOptions.transform(result) : result;
    },
    staleTime: asyncOptions.cacheConfig?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: asyncOptions.cacheConfig?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus:
      asyncOptions.cacheConfig?.refetchOnWindowFocus ?? false,
    enabled: asyncOptions.enabled ?? true,
  });

  // Return fetched options or fallback to static options
  const options =
    fetchedOptions || metadata.staticOptions || staticOptions || [];

  return {
    options,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Helper to register async options on a schema
 */
export function registerAsyncOptions(
  schema: z.ZodType,
  config: AsyncOptionsConfig,
  staticFallback?: ViewOption[]
): void {
  const metadata: OptionsQueryMetadata = {
    label: "Async Options Field", // Required by BaseMetadata
    asyncOptions: config,
    staticOptions: staticFallback,
  };

  schema.register(optionsQueryRegistry, metadata);
}

/**
 * Helper to create a fetcher that works with REST APIs
 */
export function createRestOptionsFetcher(
  endpoint: string,
  options?: {
    fetchOptions?: RequestInit;
    transform?: (data: unknown) => ViewOption[];
  }
): (params?: Record<string, unknown>) => Promise<ViewOption[]> {
  return async (params) => {
    const url = new URL(endpoint, window.location.origin);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), options?.fetchOptions);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch options: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Transform data if transformer provided
    if (options?.transform) {
      return options.transform(data);
    }

    // Default transformation - assume array of objects with value/label or id/name
    if (Array.isArray(data)) {
      return data.map((item) => ({
        value: String(item.value || item.id || item),
        label: String(item.label || item.name || item.value || item.id || item),
      }));
    }

    throw new Error("Invalid response format for options");
  };
}

/**
 * Helper to create a fetcher that works with server actions
 */
export function createServerActionOptionsFetcher<T>(
  serverAction: (params?: Record<string, unknown>) => Promise<T>,
  transform?: (data: T) => ViewOption[]
): (params?: Record<string, unknown>) => Promise<ViewOption[]> {
  return async (params) => {
    const data = await serverAction(params);

    if (transform) {
      return transform(data);
    }

    // Default transformation
    if (Array.isArray(data)) {
      return data.map((item) => ({
        value: String((item as any).value || (item as any).id || item),
        label: String(
          (item as any).label ||
            (item as any).name ||
            (item as any).value ||
            (item as any).id ||
            item
        ),
      }));
    }

    throw new Error("Invalid response format for options");
  };
}
