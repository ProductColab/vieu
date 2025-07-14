import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../components/ui/command";
import {
  Plus,
  GripVertical,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  AlertCircle,
} from "lucide-react";
import type { FieldConfigWithId } from "../schema-builder.reducer";

type SemanticFieldType =
  keyof typeof import("../../schema/field-definition-v2").semanticFields;
type FieldType = SemanticFieldType | "custom";

interface FieldListProps {
  fields: FieldConfigWithId[];
  activeFieldId?: string;
  onAddField: (type: FieldType, name?: string) => void;
  onRemoveField: (fieldId: string) => void;
  onSelectField: (fieldId: string) => void;
  onReorderFields: (fromIndex: number, toIndex: number) => void;
  onDuplicateField: (fieldId: string, newName?: string) => void;
  semanticFieldTypes: SemanticFieldType[];
  fieldErrors: Record<string, string[]>;
}

export function FieldList({
  fields,
  activeFieldId,
  onAddField,
  onRemoveField,
  onSelectField,
  onReorderFields,
  onDuplicateField,
  semanticFieldTypes,
  fieldErrors,
}: FieldListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetFieldId) return;

    const fromIndex = fields.findIndex((f) => f.id === draggedField);
    const toIndex = fields.findIndex((f) => f.id === targetFieldId);

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderFields(fromIndex, toIndex);
    }
    setDraggedField(null);
  };

  const handleAddField = (type: FieldType) => {
    onAddField(type);
    setIsAddDialogOpen(false);
  };

  const getFieldIcon = (field: FieldConfigWithId | { type: string }) => {
    if (field.type === "email" || field.type === "personName") return "📧";
    if (field.type === "phone") return "📞";
    if (field.type === "age") return "🔢";
    if (field.type === "status") return "🏷️";
    if (field.type === "role") return "👤";
    if (field.type === "bio") return "📝";
    if (field.type === "createdAt" || field.type === "updatedAt") return "📅";
    if (field.type === "custom") return "⚙️";
    return "⚙️";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add Field Button */}
      <div className="p-4 border-b">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
              <DialogDescription>
                Choose a field type to add to your schema
              </DialogDescription>
            </DialogHeader>
            <Command>
              <CommandInput placeholder="Search field types..." />
              <CommandList>
                <CommandEmpty>No field types found.</CommandEmpty>
                <CommandGroup heading="Semantic Fields">
                  {semanticFieldTypes.map((type) => (
                    <CommandItem
                      key={type}
                      onSelect={() => handleAddField(type)}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">
                        {getFieldIcon({ type } as FieldConfigWithId)}
                      </span>
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Custom">
                  <CommandItem
                    onSelect={() => handleAddField("custom")}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">⚙️</span>
                    Custom Field
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fields List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          <AnimatePresence>
            {fields.map((field) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                draggable
                onDragStart={() => handleDragStart(field.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, field.id)}
                className={`
                  group relative bg-background border rounded-lg p-3 cursor-pointer
                  transition-all duration-200 hover:shadow-md
                  ${
                    activeFieldId === field.id
                      ? "ring-2 ring-primary shadow-md"
                      : ""
                  }
                  ${draggedField === field.id ? "opacity-50 scale-95" : ""}
                `}
                onClick={() => onSelectField(field.id)}
              >
                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Field Content */}
                <div className="flex items-center justify-between ml-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{getFieldIcon(field)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {field.name || "Unnamed Field"}
                        </span>
                        {fieldErrors[field.id] &&
                          fieldErrors[field.id].length > 0 && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.contexts?.input?.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectField(field.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDuplicateField(field.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onRemoveField(field.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {fields.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-sm">No fields yet</p>
              <p className="text-xs">Click "Add Field" to get started</p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
