import React, { createContext, useContext, useState, useCallback } from "react";
import { type EntityConfigJSON } from "./config-converter";
import { semanticFields } from "../schema/field-definition-v2";

/**
 * Available semantic field types for the UI
 */
export const SEMANTIC_FIELD_TYPES = Object.keys(semanticFields) as Array<
  keyof typeof semanticFields
>;

/**
 * Schema library item - saved schema configuration
 */
export interface SchemaLibraryItem {
  /** Unique identifier for the schema */
  id: string;
  /** Display name of the schema */
  name: string;
  /** Optional description of the schema */
  description?: string;
  /** The entity configuration data */
  config: EntityConfigJSON;
  /** ISO timestamp when the schema was created */
  createdAt: string;
  /** ISO timestamp when the schema was last updated */
  updatedAt: string;
  /** Optional tags for categorizing the schema */
  tags?: string[];
}

/**
 * Metadata for saving or updating schemas
 */
export interface SchemaMetadata {
  /** Optional description of the schema */
  description?: string;
  /** Optional tags for categorizing the schema */
  tags?: string[];
}

/**
 * Storage adapter interface for persisting schemas
 */
export interface SchemaStorageAdapter {
  /** Save schemas to persistent storage */
  save: (schemas: SchemaLibraryItem[]) => Promise<void>;
  /** Load schemas from persistent storage */
  load: () => Promise<SchemaLibraryItem[]>;
}

/**
 * Default cache configuration for schema operations
 */
export interface CacheConfig {
  /** Time in milliseconds before data is considered stale */
  staleTime: number;
  /** Time in milliseconds before data is garbage collected */
  gcTime: number;
}

/**
 * Available preview modes for schema visualization
 */
export type PreviewMode = "form" | "table" | "cards" | "list" | "detail";

/**
 * Schema builder context state
 */
interface SchemaBuilderContextState {
  // Schema Library Management
  /** Array of saved schemas in the library */
  schemas: SchemaLibraryItem[];

  /**
   * Save a new schema to the library
   * @param config - The entity configuration to save
   * @param metadata - Optional metadata for the schema
   * @returns Promise resolving to the new schema ID
   */
  saveSchema: (
    config: EntityConfigJSON,
    metadata?: SchemaMetadata
  ) => Promise<string>;

  /**
   * Load a schema by its ID
   * @param id - The unique identifier of the schema
   * @returns The schema item or null if not found
   */
  loadSchema: (id: string) => SchemaLibraryItem | null;

  /**
   * Delete a schema from the library
   * @param id - The unique identifier of the schema to delete
   * @returns Promise that resolves when deletion is complete
   */
  deleteSchema: (id: string) => Promise<void>;

  /**
   * Update an existing schema in the library
   * @param id - The unique identifier of the schema to update
   * @param config - The updated entity configuration
   * @param metadata - Optional updated metadata
   * @returns Promise that resolves when update is complete
   */
  updateSchema: (
    id: string,
    config: EntityConfigJSON,
    metadata?: SchemaMetadata
  ) => Promise<void>;

  // Available Field Types
  /** Array of available semantic field types */
  semanticFieldTypes: Array<keyof typeof semanticFields>;

  // Global Settings
  /** Default cache configuration for schema operations */
  defaultCacheConfig: CacheConfig;
  /** Registry of available server actions */
  availableServerActions: Record<string, any>;

  // Live Preview State
  /** Current preview mode for schema visualization */
  previewMode: PreviewMode;

  /**
   * Set the preview mode for schema visualization
   * @param mode - The preview mode to set
   */
  setPreviewMode: (mode: PreviewMode) => void;
}

const SchemaBuilderContext = createContext<SchemaBuilderContextState | null>(
  null
);

/**
 * Props for SchemaBuilderProvider component
 */
interface SchemaBuilderProviderProps {
  /** Child components to render within the provider */
  children: React.ReactNode;
  /** Initial schemas to load into the library */
  initialSchemas?: SchemaLibraryItem[];
  /** Available server actions registry */
  serverActions?: Record<string, any>;
  /** Storage adapter for persisting schemas */
  storage?: SchemaStorageAdapter;
}

/**
 * Provider component for Schema Builder functionality
 *
 * Provides context for managing schema library, field types, and preview modes.
 * Handles persistence through optional storage adapter.
 *
 * @example
 * ```tsx
 * <SchemaBuilderProvider
 *   serverActions={{ userServerActions, productServerActions }}
 *   storage={localStorageAdapter}
 * >
 *   <App />
 * </SchemaBuilderProvider>
 * ```
 */
export function SchemaBuilderProvider({
  children,
  initialSchemas = [],
  serverActions = {},
  storage,
}: SchemaBuilderProviderProps) {
  const [schemas, setSchemas] = useState<SchemaLibraryItem[]>(initialSchemas);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("form");

  // Save a new schema to the library
  const saveSchema = useCallback(
    async (
      config: EntityConfigJSON,
      metadata?: SchemaMetadata
    ): Promise<string> => {
      const id = `schema_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date().toISOString();

      const newSchema: SchemaLibraryItem = {
        id,
        name: config.name,
        description: metadata?.description,
        config,
        createdAt: now,
        updatedAt: now,
        tags: metadata?.tags,
      };

      const updatedSchemas = [...schemas, newSchema];
      setSchemas(updatedSchemas);

      // Persist to storage if available
      if (storage?.save) {
        await storage.save(updatedSchemas);
      }

      return id;
    },
    [schemas, storage]
  );

  // Load a schema by ID
  const loadSchema = useCallback(
    (id: string): SchemaLibraryItem | null => {
      return schemas.find((s) => s.id === id) || null;
    },
    [schemas]
  );

  // Delete a schema
  const deleteSchema = useCallback(
    async (id: string): Promise<void> => {
      const updatedSchemas = schemas.filter((s) => s.id !== id);
      setSchemas(updatedSchemas);

      if (storage?.save) {
        await storage.save(updatedSchemas);
      }
    },
    [schemas, storage]
  );

  // Update an existing schema
  const updateSchema = useCallback(
    async (
      id: string,
      config: EntityConfigJSON,
      metadata?: SchemaMetadata
    ): Promise<void> => {
      const updatedSchemas = schemas.map((schema) => {
        if (schema.id === id) {
          return {
            ...schema,
            name: config.name,
            description: metadata?.description ?? schema.description,
            config,
            updatedAt: new Date().toISOString(),
            tags: metadata?.tags ?? schema.tags,
          };
        }
        return schema;
      });

      setSchemas(updatedSchemas);

      if (storage?.save) {
        await storage.save(updatedSchemas);
      }
    },
    [schemas, storage]
  );

  const contextValue: SchemaBuilderContextState = {
    schemas,
    saveSchema,
    loadSchema,
    deleteSchema,
    updateSchema,
    semanticFieldTypes: SEMANTIC_FIELD_TYPES,
    defaultCacheConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    availableServerActions: serverActions,
    previewMode,
    setPreviewMode,
  };

  return (
    <SchemaBuilderContext.Provider value={contextValue}>
      {children}
    </SchemaBuilderContext.Provider>
  );
}

/**
 * Hook to access the schema builder context
 *
 * @throws {Error} When used outside of SchemaBuilderProvider
 * @returns The schema builder context state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { schemas, saveSchema, previewMode } = useSchemaBuilderContext();
 *   // Use context values...
 * }
 * ```
 */
export function useSchemaBuilderContext() {
  const context = useContext(SchemaBuilderContext);

  if (!context) {
    throw new Error(
      "useSchemaBuilderContext must be used within a SchemaBuilderProvider"
    );
  }

  return context;
}

/**
 * Simple localStorage adapter for schema persistence
 *
 * Provides basic persistence using browser localStorage.
 * Schemas are stored as JSON under the key 'schema-builder-library'.
 *
 * @example
 * ```tsx
 * <SchemaBuilderProvider storage={localStorageAdapter}>
 *   <App />
 * </SchemaBuilderProvider>
 * ```
 */
export const localStorageAdapter: SchemaStorageAdapter = {
  /**
   * Save schemas to localStorage
   * @param schemas - Array of schemas to persist
   */
  save: async (schemas: SchemaLibraryItem[]) => {
    localStorage.setItem("schema-builder-library", JSON.stringify(schemas));
  },

  /**
   * Load schemas from localStorage
   * @returns Promise resolving to array of schemas, or empty array if none found
   */
  load: async (): Promise<SchemaLibraryItem[]> => {
    const stored = localStorage.getItem("schema-builder-library");
    return stored ? JSON.parse(stored) : [];
  },
};
