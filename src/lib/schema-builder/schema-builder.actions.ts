import type { semanticFields } from "../schema/field-definition-v2";
import type { EntityConfigJSON, FieldConfigJSON } from "./config-converter";

/**
 * Action type constants for the schema builder reducer
 */
export const SCHEMA_BUILDER_ACTIONS = {
  // Field Management
  ADD_FIELD: "ADD_FIELD",
  REMOVE_FIELD: "REMOVE_FIELD",
  UPDATE_FIELD: "UPDATE_FIELD",
  REORDER_FIELDS: "REORDER_FIELDS",
  DUPLICATE_FIELD: "DUPLICATE_FIELD",

  // Schema Management
  SET_ENTITY_NAME: "SET_ENTITY_NAME",
  LOAD_SCHEMA: "LOAD_SCHEMA",
  RESET_SCHEMA: "RESET_SCHEMA",

  // Validation
  SET_VALIDATION_ERRORS: "SET_VALIDATION_ERRORS",
  CLEAR_VALIDATION_ERRORS: "CLEAR_VALIDATION_ERRORS",

  // UI State
  SET_PREVIEW_MODE: "SET_PREVIEW_MODE",
  SET_LOADING: "SET_LOADING",
  SET_DIRTY: "SET_DIRTY",
} as const;

/**
 * Action to add a new field to the schema
 */
export interface AddFieldAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.ADD_FIELD;
  payload: {
    /** The type of field to add from semantic fields or custom */
    fieldType: keyof typeof semanticFields | "custom";
    /** The name for the new field */
    fieldName: string;
    /** Optional parameters for field initialization */
    params?: unknown[];
    /** Optional index to insert the field at (defaults to end) */
    index?: number;
  };
}

/**
 * Action to remove a field from the schema
 */
export interface RemoveFieldAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.REMOVE_FIELD;
  payload: {
    /** The ID of the field to remove */
    fieldId: string;
  };
}

/**
 * Action to update an existing field's configuration
 */
export interface UpdateFieldAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.UPDATE_FIELD;
  payload: {
    /** The ID of the field to update */
    fieldId: string;
    /** Partial field configuration updates */
    updates: Partial<FieldConfigJSON>;
  };
}

/**
 * Action to reorder fields in the schema
 */
export interface ReorderFieldsAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.REORDER_FIELDS;
  payload: {
    /** The current index of the field to move */
    fromIndex: number;
    /** The target index to move the field to */
    toIndex: number;
  };
}

/**
 * Action to duplicate an existing field
 */
export interface DuplicateFieldAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.DUPLICATE_FIELD;
  payload: {
    /** The ID of the field to duplicate */
    fieldId: string;
    /** The name for the duplicated field */
    newFieldName: string;
  };
}

/**
 * Action to set the entity name for the schema
 */
export interface SetEntityNameAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.SET_ENTITY_NAME;
  payload: {
    /** The new entity name */
    entityName: string;
  };
}

/**
 * Action to load a complete schema configuration
 */
export interface LoadSchemaAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.LOAD_SCHEMA;
  payload: {
    /** The entity configuration to load */
    config: EntityConfigJSON;
  };
}

/**
 * Action to reset the schema to its initial state
 */
export interface ResetSchemaAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.RESET_SCHEMA;
}

/**
 * Action to set validation errors for the schema
 */
export interface SetValidationErrorsAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.SET_VALIDATION_ERRORS;
  payload: {
    /** Validation errors keyed by field ID */
    errors: Record<string, string[]>;
  };
}

/**
 * Action to clear all validation errors
 */
export interface ClearValidationErrorsAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.CLEAR_VALIDATION_ERRORS;
}

/**
 * Action to toggle preview mode
 */
export interface SetPreviewModeAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.SET_PREVIEW_MODE;
  payload: {
    /** Whether preview mode is enabled */
    isPreview: boolean;
  };
}

/**
 * Action to set loading state
 */
export interface SetLoadingAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.SET_LOADING;
  payload: {
    /** Whether the schema builder is in a loading state */
    isLoading: boolean;
  };
}

/**
 * Action to set dirty state (unsaved changes)
 */
export interface SetDirtyAction {
  type: typeof SCHEMA_BUILDER_ACTIONS.SET_DIRTY;
  payload: {
    /** Whether the schema has unsaved changes */
    isDirty: boolean;
  };
}

/**
 * Union type for all schema builder actions
 */
export type SchemaBuilderAction =
  | AddFieldAction
  | RemoveFieldAction
  | UpdateFieldAction
  | ReorderFieldsAction
  | DuplicateFieldAction
  | SetEntityNameAction
  | LoadSchemaAction
  | ResetSchemaAction
  | SetValidationErrorsAction
  | ClearValidationErrorsAction
  | SetPreviewModeAction
  | SetLoadingAction
  | SetDirtyAction;

/**
 * Action creators for the schema builder
 */
export const schemaBuilderActions = {
  /**
   * Creates an action to add a new field to the schema
   * @param fieldType - The type of field to add from semantic fields or custom
   * @param fieldName - The name for the new field
   * @param params - Optional parameters for field initialization
   * @param index - Optional index to insert the field at (defaults to end)
   * @returns AddFieldAction
   */
  addField: (
    fieldType: keyof typeof semanticFields | "custom",
    fieldName: string,
    params?: unknown[],
    index?: number
  ): AddFieldAction => ({
    type: SCHEMA_BUILDER_ACTIONS.ADD_FIELD,
    payload: { fieldType, fieldName, params, index },
  }),

  /**
   * Creates an action to remove a field from the schema
   * @param fieldId - The ID of the field to remove
   * @returns RemoveFieldAction
   */
  removeField: (fieldId: string): RemoveFieldAction => ({
    type: SCHEMA_BUILDER_ACTIONS.REMOVE_FIELD,
    payload: { fieldId },
  }),

  /**
   * Creates an action to update an existing field's configuration
   * @param fieldId - The ID of the field to update
   * @param updates - Partial field configuration updates
   * @returns UpdateFieldAction
   */
  updateField: (
    fieldId: string,
    updates: Partial<FieldConfigJSON>
  ): UpdateFieldAction => ({
    type: SCHEMA_BUILDER_ACTIONS.UPDATE_FIELD,
    payload: { fieldId, updates },
  }),

  /**
   * Creates an action to reorder fields in the schema
   * @param fromIndex - The current index of the field to move
   * @param toIndex - The target index to move the field to
   * @returns ReorderFieldsAction
   */
  reorderFields: (fromIndex: number, toIndex: number): ReorderFieldsAction => ({
    type: SCHEMA_BUILDER_ACTIONS.REORDER_FIELDS,
    payload: { fromIndex, toIndex },
  }),

  /**
   * Creates an action to duplicate an existing field
   * @param fieldId - The ID of the field to duplicate
   * @param newFieldName - The name for the duplicated field
   * @returns DuplicateFieldAction
   */
  duplicateField: (
    fieldId: string,
    newFieldName: string
  ): DuplicateFieldAction => ({
    type: SCHEMA_BUILDER_ACTIONS.DUPLICATE_FIELD,
    payload: { fieldId, newFieldName },
  }),

  /**
   * Creates an action to set the entity name for the schema
   * @param entityName - The new entity name
   * @returns SetEntityNameAction
   */
  setEntityName: (entityName: string): SetEntityNameAction => ({
    type: SCHEMA_BUILDER_ACTIONS.SET_ENTITY_NAME,
    payload: { entityName },
  }),

  /**
   * Creates an action to load a complete schema configuration
   * @param config - The entity configuration to load
   * @returns LoadSchemaAction
   */
  loadSchema: (config: EntityConfigJSON): LoadSchemaAction => ({
    type: SCHEMA_BUILDER_ACTIONS.LOAD_SCHEMA,
    payload: { config },
  }),

  /**
   * Creates an action to reset the schema to its initial state
   * @returns ResetSchemaAction
   */
  resetSchema: (): ResetSchemaAction => ({
    type: SCHEMA_BUILDER_ACTIONS.RESET_SCHEMA,
  }),

  /**
   * Creates an action to set validation errors for the schema
   * @param errors - Validation errors keyed by field ID
   * @returns SetValidationErrorsAction
   */
  setValidationErrors: (
    errors: Record<string, string[]>
  ): SetValidationErrorsAction => ({
    type: SCHEMA_BUILDER_ACTIONS.SET_VALIDATION_ERRORS,
    payload: { errors },
  }),

  /**
   * Creates an action to clear all validation errors
   * @returns ClearValidationErrorsAction
   */
  clearValidationErrors: (): ClearValidationErrorsAction => ({
    type: SCHEMA_BUILDER_ACTIONS.CLEAR_VALIDATION_ERRORS,
  }),

  /**
   * Creates an action to toggle preview mode
   * @param isPreview - Whether preview mode is enabled
   * @returns SetPreviewModeAction
   */
  setPreviewMode: (isPreview: boolean): SetPreviewModeAction => ({
    type: SCHEMA_BUILDER_ACTIONS.SET_PREVIEW_MODE,
    payload: { isPreview },
  }),

  /**
   * Creates an action to set loading state
   * @param isLoading - Whether the schema builder is in a loading state
   * @returns SetLoadingAction
   */
  setLoading: (isLoading: boolean): SetLoadingAction => ({
    type: SCHEMA_BUILDER_ACTIONS.SET_LOADING,
    payload: { isLoading },
  }),

  /**
   * Creates an action to set dirty state (unsaved changes)
   * @param isDirty - Whether the schema has unsaved changes
   * @returns SetDirtyAction
   */
  setDirty: (isDirty: boolean): SetDirtyAction => ({
    type: SCHEMA_BUILDER_ACTIONS.SET_DIRTY,
    payload: { isDirty },
  }),
};

/**
 * Type for the schema builder action creators object
 */
export type SchemaBuilderActionCreators = typeof schemaBuilderActions;
