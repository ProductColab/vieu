import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import {
  X,
  Settings,
  Eye,
  Edit,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { FieldConfigWithId } from "../schema-builder.reducer";
import type { FieldConfigJSON } from "../config-converter";
import type { CrossFieldValidation } from "../../schema/conditional.types";

interface FieldEditorSidebarProps {
  activeField?: FieldConfigWithId;
  onUpdateField: (fieldId: string, updates: Partial<FieldConfigJSON>) => void;
  onClose: () => void;
  validation?: CrossFieldValidation[];
  onAddValidationRule: (rule: CrossFieldValidation) => void;
  onRemoveValidationRule: (index: number) => void;
}

export function FieldEditorSidebar({
  activeField,
  onUpdateField,
  onClose,
  validation = [],
  onAddValidationRule,
  onRemoveValidationRule,
}: FieldEditorSidebarProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["base", "input"])
  );

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateField = (updates: Partial<FieldConfigJSON>) => {
    if (activeField) {
      onUpdateField(activeField.id, updates);
    }
  };

  const updateBaseProperty = (key: string, value: any) => {
    updateField({
      base: {
        ...activeField?.base,
        [key]: value,
      },
    });
  };

  const updateContextProperty = (context: string, key: string, value: any) => {
    updateField({
      contexts: {
        ...activeField?.contexts,
        [context]: {
          ...activeField?.contexts?.[
            context as keyof typeof activeField.contexts
          ],
          [key]: value,
        },
      },
    });
  };

  if (!activeField) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground"
        >
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Field Selected</h3>
          <p className="text-sm">
            Select a field from the list to edit its properties
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-background border-l"
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Edit Field</h3>
            <p className="text-sm text-muted-foreground">
              {activeField.name || "Unnamed Field"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic Properties */}
          <Collapsible
            open={openSections.has("base")}
            onOpenChange={() => toggleSection("base")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Properties
                </div>
                {openSections.has("base") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input
                  value={activeField.name || ""}
                  onChange={(e) => updateField({ name: e.target.value })}
                  placeholder="Enter field name"
                />
              </div>

              <div className="space-y-2">
                <Label>Display Label</Label>
                <Input
                  value={activeField.base?.label || ""}
                  onChange={(e) => updateBaseProperty("label", e.target.value)}
                  placeholder="Enter display label"
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={activeField.base?.icon || ""}
                  onChange={(e) => updateBaseProperty("icon", e.target.value)}
                  placeholder="📧"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={activeField.base?.description || ""}
                  onChange={(e) =>
                    updateBaseProperty("description", e.target.value)
                  }
                  placeholder="Field description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={activeField.base?.priority || "medium"}
                  onValueChange={(value) =>
                    updateBaseProperty("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Clickable</Label>
                <Switch
                  checked={activeField.base?.clickable || false}
                  onCheckedChange={(checked) =>
                    updateBaseProperty("clickable", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Readonly</Label>
                <Switch
                  checked={activeField.base?.readonly || false}
                  onCheckedChange={(checked) =>
                    updateBaseProperty("readonly", checked)
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Input Context */}
          <Collapsible
            open={openSections.has("input")}
            onOpenChange={() => toggleSection("input")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Input Properties
                </div>
                {openSections.has("input") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={activeField.contexts?.input?.placeholder || ""}
                  onChange={(e) =>
                    updateContextProperty(
                      "input",
                      "placeholder",
                      e.target.value
                    )
                  }
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="space-y-2">
                <Label>Input Type</Label>
                <Select
                  value={activeField.contexts?.input?.inputType || "text"}
                  onValueChange={(value) =>
                    updateContextProperty("input", "inputType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="tel">Telephone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeField.contexts?.input?.inputType === "textarea" && (
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Input
                    type="number"
                    value={activeField.contexts?.input?.rows || 3}
                    onChange={(e) =>
                      updateContextProperty(
                        "input",
                        "rows",
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    max="10"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={activeField.contexts?.input?.required || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("input", "required", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Skip in Forms</Label>
                <Switch
                  checked={activeField.contexts?.input?.skip || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("input", "skip", checked)
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Display Context */}
          <Collapsible
            open={openSections.has("display")}
            onOpenChange={() => toggleSection("display")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Display Properties
                </div>
                {openSections.has("display") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Display Label</Label>
                <Input
                  value={activeField.contexts?.display?.label || ""}
                  onChange={(e) =>
                    updateContextProperty("display", "label", e.target.value)
                  }
                  placeholder="Override display label"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Clickable</Label>
                <Switch
                  checked={activeField.contexts?.display?.clickable || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("display", "clickable", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Skip in Display</Label>
                <Switch
                  checked={activeField.contexts?.display?.skip || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("display", "skip", checked)
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* List Context */}
          <Collapsible
            open={openSections.has("list")}
            onOpenChange={() => toggleSection("list")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List Properties
                </div>
                {openSections.has("list") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  value={activeField.contexts?.list?.width || ""}
                  onChange={(e) =>
                    updateContextProperty("list", "width", e.target.value)
                  }
                  placeholder="120px"
                />
              </div>

              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select
                  value={activeField.contexts?.list?.align || "left"}
                  onValueChange={(value) =>
                    updateContextProperty("list", "align", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Display Type</Label>
                <Select
                  value={activeField.contexts?.list?.displayType || "text"}
                  onValueChange={(value) =>
                    updateContextProperty("list", "displayType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={activeField.contexts?.list?.position || "primary"}
                  onValueChange={(value) =>
                    updateContextProperty("list", "position", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Sortable</Label>
                <Switch
                  checked={activeField.contexts?.list?.sortable || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("list", "sortable", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Truncate</Label>
                <Switch
                  checked={activeField.contexts?.list?.truncate || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("list", "truncate", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>As Badge</Label>
                <Switch
                  checked={activeField.contexts?.list?.asBadge || false}
                  onCheckedChange={(checked) =>
                    updateContextProperty("list", "asBadge", checked)
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Field Type Badge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Field Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{activeField.type}</Badge>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
