import { useState, useCallback, useMemo, useReducer } from "react";
import {
  type EntityConfigJSON,
  type FieldConfigJSON,
  createEntityFromConfig,
} from "./config-converter";
import { useSchemaBuilderContext } from "./schema-builder.provider";
import type { CrossFieldValidation } from "../schema/conditional.types";
import type { ServerActionFunctions } from "../query/query.registry";
import type { BaseEntity, EntityId } from "../query/types";
import {
  schemaBuilderReducer,
  initialSchemaBuilderState,
  schemaBuilderSelectors,
  type FieldConfigWithId,
} from "./schema-builder.reducer";
import { schemaBuilderActions } from "./schema-builder.actions";

type PreviewMode = "form" | "table" | "cards" | "list" | "detail";
type Transport = "rest" | "server-actions";
type SemanticFieldType =
  keyof typeof import("../schema/field-definition-v2").semanticFields;
type FieldType = SemanticFieldType | "custom";

type CacheConfig = {
  staleTime?: number;
  gcTime?: number;
};

type SaveMetadata = {
  description?: string;
  tags?: string[];
};

type SchemaLibraryItem = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Extended state for additional features not in core reducer
 */
interface ExtendedSchemaBuilderState {
  // Basic Entity Info (some handled by reducer)
  description?: string;
  transport?: Transport;
  serverActions?: ServerActionFunctions<BaseEntity, EntityId>;

  // Advanced Configuration
  cacheConfig?: CacheConfig;
  validation?: CrossFieldValidation[];

  // UI State
  activeFieldId?: string;
}

/**
 * Combined state interface for public API
 */
interface SchemaBuilderState extends ExtendedSchemaBuilderState {
  // Core state from reducer
  name: string;
  fields: FieldConfigWithId[];
  isDirty: boolean;
  isLoading: boolean;
  validationErrors: Record<string, string[]>;

  // Global state from provider
  previewMode: PreviewMode;
  availableServerActions: Record<
    string,
    ServerActionFunctions<BaseEntity, EntityId>
  >;
  semanticFieldTypes: SemanticFieldType[];
}

/**
 * Actions for the schema builder
 */
interface SchemaBuilderActions {
  // Basic Entity Actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setTransport: (transport: Transport) => void;
  setServerActions: (
    serverActions: ServerActionFunctions<BaseEntity, EntityId>
  ) => void;

  // Field Management (powered by reducer)
  addField: (type: FieldType, name?: string) => void;
  removeField: (fieldId: string) => void;
  updateField: (fieldId: string, field: Partial<FieldConfigJSON>) => void;
  reorderFields: (fromIndex: number, toIndex: number) => void;
  duplicateField: (fieldId: string, newName?: string) => void;

  // Field Selection
  setActiveField: (fieldId?: string) => void;

  // Advanced Configuration
  setCacheConfig: (config: { staleTime: number; gcTime: number }) => void;
  addValidationRule: (rule: CrossFieldValidation) => void;
  removeValidationRule: (index: number) => void;

  // Validation Management (from reducer)
  setValidationErrors: (errors: Record<string, string[]>) => void;
  clearValidationErrors: () => void;

  // Loading State Management (from reducer)
  setLoading: (isLoading: boolean) => void;

  // Schema Operations
  reset: () => void;
  loadFromConfig: (config: EntityConfigJSON) => void;
  save: (metadata?: SaveMetadata) => Promise<string>;

  // Enhanced Schema Library Operations
  loadSchemaById: (id: string) => boolean;
  deleteSchemaById: (id: string) => Promise<void>;
  saveOrUpdateSchema: (
    schemaId?: string,
    metadata?: SaveMetadata
  ) => Promise<string>;

  // Global Preview Control
  setGlobalPreviewMode: (mode: PreviewMode) => void;

  // Preview Generation
  generatePreviewSchemas: () => ReturnType<
    typeof createEntityFromConfig
  > | null;
}

/**
 * Result of the useSchemaBuilder hook
 */
interface UseSchemaBuilderResult {
  state: SchemaBuilderState;
  actions: SchemaBuilderActions;
  config: EntityConfigJSON;
  previewSchemas: ReturnType<typeof createEntityFromConfig> | null;
  validation: ValidationResult;
  // Schema Library Access
  schemaLibrary: SchemaLibraryItem[];
  // Powerful Utilities (from reducer selectors)
  utils: {
    // Field lookups
    getFieldById: (fieldId: string) => FieldConfigWithId | undefined;
    getFieldByName: (fieldName: string) => FieldConfigWithId | undefined;
    getFieldIndex: (fieldId: string) => number;
    getFieldNames: () => string[];
    getFieldTypes: () => FieldType[];
    getFieldErrors: (fieldId: string) => string[];
    // State checks
    canSave: () => boolean;
    isEmpty: () => boolean;
    hasValidationErrors: () => boolean;
    // Metadata
    getVersion: () => number;
    getLastSavedAt: () => Date | undefined;
  };
}

/**
 * Hook for building and editing schemas with live preview
 * Now uses reducer for core field management (performance optimized!)
 */
export function useSchemaBuilder(
  initialConfig?: EntityConfigJSON
): UseSchemaBuilderResult {
  const {
    defaultCacheConfig,
    saveSchema,
    updateSchema,
    loadSchema,
    deleteSchema,
    schemas,
    availableServerActions,
    semanticFieldTypes,
    previewMode,
    setPreviewMode,
  } = useSchemaBuilderContext();

  // Core state managed by reducer (performance optimized!)
  const [coreState, dispatch] = useReducer(schemaBuilderReducer, {
    ...initialSchemaBuilderState,
    entityName: initialConfig?.name || "New Entity",
    fields:
      initialConfig?.fields?.map((field) => ({
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })) || [],
  });

  // Extended state for additional features
  const [extendedState, setExtendedState] =
    useState<ExtendedSchemaBuilderState>(() => ({
      description: undefined,
      transport: initialConfig?.transport || "server-actions",
      serverActions: initialConfig?.serverActions,
      cacheConfig: initialConfig?.cacheConfig || defaultCacheConfig,
      validation: initialConfig?.validation || [],
      activeFieldId: undefined,
    }));

  // Update extended state helper
  const updateExtendedState = useCallback(
    (updates: Partial<ExtendedSchemaBuilderState>) => {
      setExtendedState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Combined state for public API
  const combinedState: SchemaBuilderState = useMemo(
    () => ({
      name: schemaBuilderSelectors.getEntityName(coreState),
      fields: schemaBuilderSelectors.getFields(coreState),
      isDirty: schemaBuilderSelectors.getIsDirty(coreState),
      isLoading: schemaBuilderSelectors.getIsLoading(coreState),
      validationErrors: schemaBuilderSelectors.getValidationErrors(coreState),
      // Global state from provider
      previewMode,
      availableServerActions,
      semanticFieldTypes,
      ...extendedState,
    }),
    [
      coreState,
      extendedState,
      previewMode,
      availableServerActions,
      semanticFieldTypes,
    ]
  );

  // Basic entity actions
  const setName = useCallback((name: string) => {
    dispatch(schemaBuilderActions.setEntityName(name));
  }, []);

  const setDescription = useCallback(
    (description: string) => {
      updateExtendedState({ description });
    },
    [updateExtendedState]
  );

  const setTransport = useCallback(
    (transport: Transport) => {
      updateExtendedState({ transport });
    },
    [updateExtendedState]
  );

  const setServerActions = useCallback(
    (serverActions: ServerActionFunctions<BaseEntity, EntityId>) => {
      updateExtendedState({ serverActions });
    },
    [updateExtendedState]
  );

  // Field management actions (powered by reducer!)
  const addField = useCallback((type: FieldType, name?: string) => {
    const fieldName = name || `${type}_field`;
    dispatch(schemaBuilderActions.addField(type, fieldName));
  }, []);

  const removeField = useCallback(
    (fieldId: string) => {
      dispatch(schemaBuilderActions.removeField(fieldId));
      // Clear active field if it was the removed one
      if (extendedState.activeFieldId === fieldId) {
        updateExtendedState({ activeFieldId: undefined });
      }
    },
    [extendedState.activeFieldId, updateExtendedState]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FieldConfigJSON>) => {
      dispatch(schemaBuilderActions.updateField(fieldId, updates));
    },
    []
  );

  const reorderFields = useCallback((fromIndex: number, toIndex: number) => {
    dispatch(schemaBuilderActions.reorderFields(fromIndex, toIndex));
  }, []);

  const duplicateField = useCallback(
    (fieldId: string, newName?: string) => {
      const field = schemaBuilderSelectors.getFieldById(coreState, fieldId);
      const finalName =
        newName || (field ? `${field.name}_copy` : "copied_field");
      dispatch(schemaBuilderActions.duplicateField(fieldId, finalName));
    },
    [coreState]
  );

  const setActiveField = useCallback(
    (fieldId?: string) => {
      updateExtendedState({ activeFieldId: fieldId });
    },
    [updateExtendedState]
  );

  // Advanced configuration actions
  const setCacheConfig = useCallback(
    (cacheConfig: { staleTime: number; gcTime: number }) => {
      updateExtendedState({ cacheConfig });
    },
    [updateExtendedState]
  );

  const addValidationRule = useCallback(
    (rule: CrossFieldValidation) => {
      updateExtendedState({
        validation: [...(extendedState.validation || []), rule],
      });
    },
    [extendedState.validation, updateExtendedState]
  );

  const removeValidationRule = useCallback(
    (index: number) => {
      const newValidation =
        extendedState.validation?.filter((_, i) => i !== index) || [];
      updateExtendedState({ validation: newValidation });
    },
    [extendedState.validation, updateExtendedState]
  );

  // Schema operations
  const reset = useCallback(() => {
    dispatch(schemaBuilderActions.resetSchema());
    setExtendedState({
      description: undefined,
      transport: "server-actions",
      serverActions: undefined,
      cacheConfig: defaultCacheConfig,
      validation: [],
      activeFieldId: undefined,
    });
  }, [defaultCacheConfig]);

  const loadFromConfig = useCallback(
    (config: EntityConfigJSON) => {
      dispatch(schemaBuilderActions.loadSchema(config));
      setExtendedState({
        description: undefined,
        transport: config.transport || "server-actions",
        serverActions: config.serverActions,
        cacheConfig: config.cacheConfig || defaultCacheConfig,
        validation: config.validation || [],
        activeFieldId: undefined,
      });
    },
    [defaultCacheConfig]
  );

  const save = useCallback(
    async (metadata?: SaveMetadata) => {
      const config: EntityConfigJSON = {
        name: combinedState.name,
        fields: combinedState.fields,
        transport: combinedState.transport,
        serverActions: combinedState.serverActions,
        cacheConfig: combinedState.cacheConfig,
        validation: combinedState.validation,
      };

      const id = await saveSchema(config, metadata);
      dispatch(schemaBuilderActions.setDirty(false));
      return id;
    },
    [combinedState, saveSchema]
  );

  // Enhanced schema library operations
  const loadSchemaById = useCallback(
    (id: string): boolean => {
      const schema = loadSchema(id);
      if (schema) {
        dispatch(schemaBuilderActions.loadSchema(schema.config));
        setExtendedState({
          description: schema.description,
          transport: schema.config.transport || "server-actions",
          serverActions: schema.config.serverActions,
          cacheConfig: schema.config.cacheConfig || defaultCacheConfig,
          validation: schema.config.validation || [],
          activeFieldId: undefined,
        });
        return true;
      }
      return false;
    },
    [loadSchema, defaultCacheConfig]
  );

  const deleteSchemaById = useCallback(
    async (id: string): Promise<void> => {
      await deleteSchema(id);
    },
    [deleteSchema]
  );

  const saveOrUpdateSchema = useCallback(
    async (schemaId?: string, metadata?: SaveMetadata): Promise<string> => {
      const config: EntityConfigJSON = {
        name: combinedState.name,
        fields: combinedState.fields,
        transport: combinedState.transport,
        serverActions: combinedState.serverActions,
        cacheConfig: combinedState.cacheConfig,
        validation: combinedState.validation,
      };

      if (schemaId) {
        // Update existing schema
        await updateSchema(schemaId, config, metadata);
        dispatch(schemaBuilderActions.setDirty(false));
        return schemaId;
      } else {
        // Create new schema
        const id = await saveSchema(config, metadata);
        dispatch(schemaBuilderActions.setDirty(false));
        return id;
      }
    },
    [combinedState, saveSchema, updateSchema]
  );

  const setGlobalPreviewMode = useCallback(
    (mode: PreviewMode) => {
      setPreviewMode(mode);
    },
    [setPreviewMode]
  );

  // Validation management actions (from reducer!)
  const setValidationErrors = useCallback(
    (errors: Record<string, string[]>) => {
      dispatch(schemaBuilderActions.setValidationErrors(errors));
    },
    []
  );

  const clearValidationErrors = useCallback(() => {
    dispatch(schemaBuilderActions.clearValidationErrors());
  }, []);

  // Loading state management (from reducer!)
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch(schemaBuilderActions.setLoading(isLoading));
  }, []);

  // Generate current config
  const config = useMemo(
    (): EntityConfigJSON => ({
      name: combinedState.name,
      fields: combinedState.fields,
      transport: combinedState.transport,
      serverActions: combinedState.serverActions,
      cacheConfig: combinedState.cacheConfig,
      validation: combinedState.validation,
    }),
    [combinedState]
  );

  // Generate preview schemas
  const previewSchemas = useMemo(() => {
    try {
      if (combinedState.fields.length === 0) return null;
      return createEntityFromConfig(config);
    } catch (error) {
      console.warn("Failed to generate preview schemas:", error);
      return null;
    }
  }, [config, combinedState.fields.length]);

  // Powerful utilities using reducer selectors
  const utils = useMemo(
    () => ({
      // Field lookups
      getFieldById: (fieldId: string) =>
        schemaBuilderSelectors.getFieldById(coreState, fieldId),
      getFieldByName: (fieldName: string) =>
        schemaBuilderSelectors.getFieldByName(coreState, fieldName),
      getFieldIndex: (fieldId: string) =>
        schemaBuilderSelectors.getFieldIndex(coreState, fieldId),
      getFieldNames: () => schemaBuilderSelectors.getFieldNames(coreState),
      getFieldTypes: () =>
        schemaBuilderSelectors.getFieldTypes(coreState) as FieldType[],
      getFieldErrors: (fieldId: string) =>
        schemaBuilderSelectors.getFieldErrors(coreState, fieldId),
      // State checks
      canSave: () => schemaBuilderSelectors.canSave(coreState),
      isEmpty: () => schemaBuilderSelectors.isEmpty(coreState),
      hasValidationErrors: () =>
        schemaBuilderSelectors.hasValidationErrors(coreState),
      // Metadata
      getVersion: () => schemaBuilderSelectors.getVersion(coreState),
      getLastSavedAt: () => schemaBuilderSelectors.getLastSavedAt(coreState),
    }),
    [coreState]
  );

  // Validation (enhanced with reducer validation + utils)
  const validation = useMemo((): ValidationResult => {
    const errors: string[] = [];

    if (!combinedState.name.trim()) {
      errors.push("Entity name is required");
    }

    if (combinedState.fields.length === 0) {
      errors.push("At least one field is required");
    }

    // Check for duplicate field names
    const fieldNames = utils.getFieldNames();
    const duplicates = fieldNames.filter(
      (name, index) => fieldNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`Duplicate field names: ${duplicates.join(", ")}`);
    }

    // Check for invalid field names
    combinedState.fields.forEach((field, index) => {
      if (!field.name.trim()) {
        errors.push(`Field ${index + 1} name is required`);
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(`Field "${field.name}" has invalid name format`);
      }
    });

    // Add reducer validation errors
    if (utils.hasValidationErrors()) {
      Object.entries(
        schemaBuilderSelectors.getValidationErrors(coreState)
      ).forEach(([_fieldId, fieldErrors]) => {
        errors.push(...fieldErrors);
      });
    }

    return {
      isValid: errors.length === 0 && utils.canSave(),
      errors,
    };
  }, [combinedState, coreState, utils]);

  const actions: SchemaBuilderActions = {
    setName,
    setDescription,
    setTransport,
    setServerActions,
    addField,
    removeField,
    updateField,
    reorderFields,
    duplicateField,
    setActiveField,
    setCacheConfig,
    addValidationRule,
    removeValidationRule,
    // Validation Management (from reducer)
    setValidationErrors,
    clearValidationErrors,
    // Loading State Management (from reducer)
    setLoading,
    reset,
    loadFromConfig,
    save,
    // Enhanced Schema Library Operations
    loadSchemaById,
    deleteSchemaById,
    saveOrUpdateSchema,
    // Global Preview Control
    setGlobalPreviewMode,
    generatePreviewSchemas: () => previewSchemas,
  };

  return {
    state: combinedState,
    actions,
    config,
    previewSchemas,
    validation,
    // Schema Library Access - expose saved schemas for browsing
    schemaLibrary: schemas.map(
      (schema): SchemaLibraryItem => ({
        id: schema.id,
        name: schema.name,
        description: schema.description,
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        tags: schema.tags,
      })
    ),
    // Powerful Utilities - all reducer selectors exposed!
    utils,
  };
}
