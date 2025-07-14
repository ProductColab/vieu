import { SCHEMA_BUILDER_ACTIONS } from "./schema-builder.actions";
import type { SchemaBuilderAction } from "./schema-builder.actions";
import type { EntityConfigJSON, FieldConfigJSON } from "./config-converter";

/**
 * Extended field configuration with UI state
 * @interface FieldConfigWithId
 * @extends FieldConfigJSON
 */
export interface FieldConfigWithId extends FieldConfigJSON {
  /** Unique identifier for the field */
  id: string;
}

/**
 * State interface for the schema builder
 * @interface SchemaBuilderState
 */
export interface SchemaBuilderState {
  // Schema Configuration
  /** Name of the entity being built */
  entityName: string;
  /** Array of field configurations with IDs */
  fields: FieldConfigWithId[];

  // UI State
  /** Whether the schema builder is in preview mode */
  isPreview: boolean;
  /** Whether the schema builder is in a loading state */
  isLoading: boolean;
  /** Whether the schema has unsaved changes */
  isDirty: boolean;

  // Validation
  /** Validation errors keyed by field ID */
  validationErrors: Record<string, string[]>;

  // Metadata
  /** Timestamp of when the schema was last saved */
  lastSavedAt?: Date;
  /** Version number for optimistic updates */
  version: number;
}

/**
 * Initial state for the schema builder
 * @constant
 */
export const initialSchemaBuilderState: SchemaBuilderState = {
  entityName: "",
  fields: [],
  isPreview: false,
  isLoading: false,
  isDirty: false,
  validationErrors: {},
  version: 1,
};

/**
 * Generates a unique field ID
 * @returns Unique field identifier string
 */
const generateFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generates a unique field name based on existing fields
 * @param baseName - The base name to use for the field
 * @param existingFields - Array of existing fields to check against
 * @returns Unique field name
 */
const generateFieldName = (
  baseName: string,
  existingFields: FieldConfigWithId[]
): string => {
  const existingNames = existingFields.map((f) => f.name);
  let counter = 1;
  let name = baseName;

  while (existingNames.includes(name)) {
    name = `${baseName}_${counter}`;
    counter++;
  }

  return name;
};

/**
 * Moves an item from one index to another in an array
 * @template T - The type of items in the array
 * @param array - The array to modify
 * @param fromIndex - The current index of the item
 * @param toIndex - The target index for the item
 * @returns New array with the item moved
 */
const moveArrayItem = <T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Schema builder reducer function
 * @param state - Current schema builder state
 * @param action - Action to process
 * @returns New schema builder state
 */
export const schemaBuilderReducer = (
  state: SchemaBuilderState = initialSchemaBuilderState,
  action: SchemaBuilderAction
): SchemaBuilderState => {
  switch (action.type) {
    case SCHEMA_BUILDER_ACTIONS.ADD_FIELD: {
      const { fieldType, fieldName, index } = action.payload;

      // Generate unique field name if needed
      const finalFieldName =
        fieldName || generateFieldName(fieldType, state.fields);

      const newField: FieldConfigWithId = {
        id: generateFieldId(),
        name: finalFieldName,
        type: fieldType,
        ...(fieldType === "custom" && {
          zodSchema: {
            type: "string" as const,
            constraints: {
              required: true,
            },
          },
        }),
      };

      const newFields = [...state.fields];
      if (
        typeof index === "number" &&
        index >= 0 &&
        index <= newFields.length
      ) {
        newFields.splice(index, 0, newField);
      } else {
        newFields.push(newField);
      }

      return {
        ...state,
        fields: newFields,
        isDirty: true,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.REMOVE_FIELD: {
      const { fieldId } = action.payload;

      return {
        ...state,
        fields: state.fields.filter((field) => field.id !== fieldId),
        isDirty: true,
        version: state.version + 1,
        // Clear validation errors for removed field
        validationErrors: Object.fromEntries(
          Object.entries(state.validationErrors).filter(
            ([key]) => key !== fieldId
          )
        ),
      };
    }

    case SCHEMA_BUILDER_ACTIONS.UPDATE_FIELD: {
      const { fieldId, updates } = action.payload;

      return {
        ...state,
        fields: state.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
        isDirty: true,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.REORDER_FIELDS: {
      const { fromIndex, toIndex } = action.payload;

      if (
        fromIndex < 0 ||
        fromIndex >= state.fields.length ||
        toIndex < 0 ||
        toIndex >= state.fields.length ||
        fromIndex === toIndex
      ) {
        return state;
      }

      return {
        ...state,
        fields: moveArrayItem(state.fields, fromIndex, toIndex),
        isDirty: true,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.DUPLICATE_FIELD: {
      const { fieldId, newFieldName } = action.payload;

      const originalField = state.fields.find((field) => field.id === fieldId);
      if (!originalField) {
        return state;
      }

      const finalFieldName =
        newFieldName ||
        generateFieldName(`${originalField.name}_copy`, state.fields);

      const duplicatedField: FieldConfigWithId = {
        ...originalField,
        id: generateFieldId(),
        name: finalFieldName,
      };

      const originalIndex = state.fields.findIndex(
        (field) => field.id === fieldId
      );
      const newFields = [...state.fields];
      newFields.splice(originalIndex + 1, 0, duplicatedField);

      return {
        ...state,
        fields: newFields,
        isDirty: true,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.SET_ENTITY_NAME: {
      const { entityName } = action.payload;

      return {
        ...state,
        entityName,
        isDirty: true,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.LOAD_SCHEMA: {
      const { config } = action.payload;

      // Add IDs to fields if they don't have them
      const fieldsWithIds = config.fields.map((field) => ({
        ...field,
        id: generateFieldId(),
      }));

      return {
        ...state,
        entityName: config.name,
        fields: fieldsWithIds,
        isDirty: false,
        validationErrors: {},
        version: state.version + 1,
        lastSavedAt: new Date(),
      };
    }

    case SCHEMA_BUILDER_ACTIONS.RESET_SCHEMA: {
      return {
        ...initialSchemaBuilderState,
        version: state.version + 1,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.SET_VALIDATION_ERRORS: {
      const { errors } = action.payload;

      return {
        ...state,
        validationErrors: errors,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.CLEAR_VALIDATION_ERRORS: {
      return {
        ...state,
        validationErrors: {},
      };
    }

    case SCHEMA_BUILDER_ACTIONS.SET_PREVIEW_MODE: {
      const { isPreview } = action.payload;

      return {
        ...state,
        isPreview,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.SET_LOADING: {
      const { isLoading } = action.payload;

      return {
        ...state,
        isLoading,
      };
    }

    case SCHEMA_BUILDER_ACTIONS.SET_DIRTY: {
      const { isDirty } = action.payload;

      return {
        ...state,
        isDirty,
        ...(isDirty ? {} : { lastSavedAt: new Date() }),
      };
    }

    default: {
      return state;
    }
  }
};

/**
 * Selector functions for the schema builder state
 * @namespace schemaBuilderSelectors
 */
export const schemaBuilderSelectors = {
  // Basic selectors
  /** Gets the entity name from state */
  getEntityName: (state: SchemaBuilderState) => state.entityName,
  /** Gets the fields array from state */
  getFields: (state: SchemaBuilderState) => state.fields,
  /** Gets the preview mode status from state */
  getIsPreview: (state: SchemaBuilderState) => state.isPreview,
  /** Gets the loading status from state */
  getIsLoading: (state: SchemaBuilderState) => state.isLoading,
  /** Gets the dirty status from state */
  getIsDirty: (state: SchemaBuilderState) => state.isDirty,
  /** Gets the validation errors from state */
  getValidationErrors: (state: SchemaBuilderState) => state.validationErrors,
  /** Gets the version number from state */
  getVersion: (state: SchemaBuilderState) => state.version,
  /** Gets the last saved timestamp from state */
  getLastSavedAt: (state: SchemaBuilderState) => state.lastSavedAt,

  // Computed selectors
  /**
   * Gets a field by its ID
   * @param state - Schema builder state
   * @param fieldId - ID of the field to find
   * @returns Field configuration or undefined
   */
  getFieldById: (state: SchemaBuilderState, fieldId: string) =>
    state.fields.find((field) => field.id === fieldId),

  /**
   * Gets a field by its name
   * @param state - Schema builder state
   * @param fieldName - Name of the field to find
   * @returns Field configuration or undefined
   */
  getFieldByName: (state: SchemaBuilderState, fieldName: string) =>
    state.fields.find((field) => field.name === fieldName),

  /**
   * Gets the index of a field by its ID
   * @param state - Schema builder state
   * @param fieldId - ID of the field to find
   * @returns Index of the field or -1 if not found
   */
  getFieldIndex: (state: SchemaBuilderState, fieldId: string) =>
    state.fields.findIndex((field) => field.id === fieldId),

  /**
   * Gets an array of all field names
   * @param state - Schema builder state
   * @returns Array of field names
   */
  getFieldNames: (state: SchemaBuilderState) =>
    state.fields.map((field) => field.name),

  /**
   * Gets an array of all field types
   * @param state - Schema builder state
   * @returns Array of field types
   */
  getFieldTypes: (state: SchemaBuilderState) =>
    state.fields.map((field) => field.type),

  /**
   * Checks if there are any validation errors
   * @param state - Schema builder state
   * @returns True if there are validation errors
   */
  hasValidationErrors: (state: SchemaBuilderState) =>
    Object.keys(state.validationErrors).length > 0,

  /**
   * Gets validation errors for a specific field
   * @param state - Schema builder state
   * @param fieldId - ID of the field
   * @returns Array of error messages for the field
   */
  getFieldErrors: (state: SchemaBuilderState, fieldId: string) =>
    state.validationErrors[fieldId] || [],

  /**
   * Determines if the schema can be saved
   * @param state - Schema builder state
   * @returns True if the schema can be saved
   */
  canSave: (state: SchemaBuilderState) =>
    state.isDirty &&
    state.entityName.trim().length > 0 &&
    state.fields.length > 0 &&
    !schemaBuilderSelectors.hasValidationErrors(state),

  /**
   * Gets the entity configuration for export
   * @param state - Schema builder state
   * @returns Entity configuration JSON
   */
  getEntityConfig: (state: SchemaBuilderState): EntityConfigJSON => ({
    name: state.entityName,
    fields: state.fields,
  }),

  /**
   * Checks if the schema is empty
   * @param state - Schema builder state
   * @returns True if the schema is empty
   */
  isEmpty: (state: SchemaBuilderState) =>
    state.entityName.trim().length === 0 && state.fields.length === 0,
};

/**
 * Type for the schema builder selectors object
 */
export type SchemaBuilderSelectors = typeof schemaBuilderSelectors;
