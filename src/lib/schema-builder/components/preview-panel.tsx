import { motion } from "framer-motion";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  Edit,
  Table,
  CreditCard,
  List,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { EntityConfigJSON } from "../config-converter";

type PreviewMode = "form" | "table" | "cards" | "list" | "detail";

interface PreviewPanelProps {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  previewSchemas: any; // This would be the actual schema objects
  config: EntityConfigJSON;
  isLoading: boolean;
}

export function PreviewPanel({
  previewMode,
  onPreviewModeChange,
  previewSchemas,
  config,
  isLoading,
}: PreviewPanelProps) {
  const previewModes = [
    { id: "form", label: "Form", icon: Edit },
    { id: "table", label: "Table", icon: Table },
    { id: "cards", label: "Cards", icon: CreditCard },
    { id: "list", label: "List", icon: List },
    { id: "detail", label: "Detail", icon: FileText },
  ] as const;

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!previewSchemas || config.fields.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
          <p className="text-sm text-muted-foreground">
            Add some fields to see a preview
          </p>
        </div>
      );
    }

    // Mock preview based on mode
    switch (previewMode) {
      case "form":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Preview</h3>
            <div className="space-y-3">
              {config.fields.map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.base?.label || field.name}
                    {field.contexts?.input?.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>
                  <div className="h-10 bg-muted rounded-md flex items-center px-3 text-sm text-muted-foreground">
                    {field.contexts?.input?.placeholder ||
                      `Enter ${field.name}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Table Preview</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <div className="flex gap-4">
                  {config.fields.map((field, index) => (
                    <div key={index} className="flex-1 text-sm font-medium">
                      {field.base?.label || field.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {config.fields.map((_, index) => (
                    <div key={index} className="flex-1">
                      Sample data
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "cards":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cards Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <Card key={item}>
                  <CardHeader className="pb-2">
                    {config.fields.find(
                      (f) => f.contexts?.card?.position === "header"
                    ) && (
                      <CardTitle className="text-sm">
                        {config.fields.find(
                          (f) => f.contexts?.card?.position === "header"
                        )?.base?.label || "Header Field"}
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {config.fields
                        .filter((f) => f.contexts?.card?.position === "body")
                        .map((field, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">
                              {field.base?.label || field.name}:
                            </span>
                            <span className="text-muted-foreground ml-2">
                              Sample data
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "list":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">List Preview</h3>
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {config.fields.find(
                        (f) => f.contexts?.list?.position === "primary"
                      ) && (
                        <div className="font-medium">
                          {config.fields.find(
                            (f) => f.contexts?.list?.position === "primary"
                          )?.base?.label || "Primary Field"}
                        </div>
                      )}
                      {config.fields
                        .filter(
                          (f) => f.contexts?.list?.position === "secondary"
                        )
                        .map((field, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {field.base?.label || field.name}: Sample data
                          </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      {config.fields
                        .filter((f) => f.contexts?.list?.asBadge)
                        .map((field, index) => (
                          <Badge key={index} variant="outline">
                            {field.base?.label || field.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "detail":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detail Preview</h3>
            <div className="space-y-6">
              {/* Group fields by section */}
              {[
                ...new Set(
                  config.fields.map(
                    (f) => f.contexts?.detail?.section || "General"
                  )
                ),
              ].map((section) => (
                <div key={section} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {section}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.fields
                      .filter(
                        (f) =>
                          (f.contexts?.detail?.section || "General") === section
                      )
                      .map((field, index) => (
                        <div key={index} className="space-y-1">
                          <div className="text-sm font-medium">
                            {field.base?.label || field.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sample data for {field.name}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Preview
          </h2>
          <Badge variant="outline">{config.name || "Untitled Schema"}</Badge>
        </div>

        {/* Mode Selector */}
        <Tabs
          value={previewMode}
          onValueChange={(value) => onPreviewModeChange(value as PreviewMode)}
        >
          <TabsList className="grid w-full grid-cols-5">
            {previewModes.map((mode) => (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className="flex items-center gap-1"
              >
                <mode.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{mode.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <motion.div
            key={previewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPreview()}
          </motion.div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {config.fields.length} field{config.fields.length !== 1 ? "s" : ""}
          </span>
          <span>Transport: {config.transport || "server-actions"}</span>
        </div>
      </div>
    </div>
  );
}
