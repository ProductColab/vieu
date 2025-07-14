import { motion } from "framer-motion";
import { useSchemaBuilder } from "../use-schema-builder";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../../components/ui/resizable";
import { Separator } from "../../../components/ui/separator";
import { EntityBasicInfo } from "./entity-basic-info";
import { FieldList } from "./field-list";
import { FieldEditorSidebar } from "./field-editor-sidebar";
import { PreviewPanel } from "./preview-panel";
import { SchemaActions } from "./schema-actions";
import { ValidationDisplay } from "./validation-display";
import type { EntityConfigJSON } from "../config-converter";

interface SchemaBuilderLayoutProps {
  initialConfig?: EntityConfigJSON;
  onSave?: (config: EntityConfigJSON) => void;
  onCancel?: () => void;
}

export function SchemaBuilderLayout({
  initialConfig,
  onSave,
  onCancel,
}: SchemaBuilderLayoutProps) {
  const schemaBuilder = useSchemaBuilder(initialConfig);
  const { state, actions, config, validation } = schemaBuilder;

  const handleSave = async () => {
    if (validation.isValid) {
      await actions.save();
      onSave?.(config);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Schema Builder</h1>
            <Separator orientation="vertical" className="h-6" />
            <EntityBasicInfo
              name={state.name}
              description={state.description}
              transport={state.transport}
              onNameChange={actions.setName}
              onDescriptionChange={actions.setDescription}
              onTransportChange={actions.setTransport}
            />
          </div>
          <SchemaActions
            onSave={handleSave}
            onCancel={onCancel}
            canSave={validation.isValid}
            isDirty={state.isDirty}
            isLoading={state.isLoading}
            onReset={actions.reset}
            schemaLibrary={schemaBuilder.schemaLibrary}
            onLoadSchema={actions.loadSchemaById}
          />
        </div>
      </motion.header>

      {/* Validation Display */}
      {!validation.isValid && (
        <ValidationDisplay
          errors={validation.errors}
          fieldErrors={state.validationErrors}
          onClearErrors={actions.clearValidationErrors}
        />
      )}

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Field Configuration */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Fields
                </h2>
              </div>
              <FieldList
                fields={state.fields}
                activeFieldId={state.activeFieldId}
                onAddField={actions.addField}
                onRemoveField={actions.removeField}
                onSelectField={actions.setActiveField}
                onReorderFields={actions.reorderFields}
                onDuplicateField={actions.duplicateField}
                semanticFieldTypes={state.semanticFieldTypes}
                fieldErrors={state.validationErrors}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Middle Panel - Field Editor */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <FieldEditorSidebar
              activeField={
                state.activeFieldId
                  ? schemaBuilder.utils.getFieldById(state.activeFieldId)
                  : undefined
              }
              onUpdateField={actions.updateField}
              onClose={() => actions.setActiveField(undefined)}
              validation={state.validation}
              onAddValidationRule={actions.addValidationRule}
              onRemoveValidationRule={actions.removeValidationRule}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Preview */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <PreviewPanel
              previewMode={state.previewMode}
              onPreviewModeChange={actions.setGlobalPreviewMode}
              previewSchemas={schemaBuilder.previewSchemas}
              config={config}
              isLoading={state.isLoading}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.main>
    </motion.div>
  );
}
