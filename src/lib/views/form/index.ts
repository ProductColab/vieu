// Main form components
export { SchemaForm, FormSectionComponent } from "./form.components";

// Form registry and types
export {
  type FormFieldMetadata,
  type FormComponentProps,
  type FormSection,
  type FormSections,
  getFormSections,
  groupFieldsBySection,
  getOrderedSections,
  registerFormSections,
  buildFormProps,
  getFormComponentType,
  getInputType,
  formComponentTypeMap,
  DEFAULT_SECTION_ID,
  DEFAULT_SECTION,
} from "./form.registry";

// Renderer and field components
export {
  formRegistrySystem,
  formRegistry,
  getComponentFromSchema,
  FormFieldRenderer,
  EnhancedFormField,
} from "./renderer";

// Individual field components
export {
  renderInputComponent,
  renderTextareaComponent,
  renderSelectComponent,
  renderCheckboxComponent,
} from "./fields";

// Re-export async options functionality for convenience
export {
  registerAsyncOptions,
  createRestOptionsFetcher,
  createServerActionOptionsFetcher,
  useSchemaOptions,
  type AsyncOptionsConfig,
  type OptionsQueryMetadata,
} from "../../schema/options-query";
