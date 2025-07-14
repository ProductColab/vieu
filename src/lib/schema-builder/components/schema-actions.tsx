import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Save,
  FolderOpen,
  RotateCcw,
  X,
  Plus,
  Clock,
  Tag,
  ChevronDown,
  Loader2,
} from "lucide-react";

type SchemaLibraryItem = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

interface SchemaActionsProps {
  onSave: () => void;
  onCancel?: () => void;
  canSave: boolean;
  isDirty: boolean;
  isLoading: boolean;
  onReset: () => void;
  schemaLibrary: SchemaLibraryItem[];
  onLoadSchema: (id: string) => void;
}

export function SchemaActions({
  onSave,
  onCancel,
  canSave,
  isDirty,
  isLoading,
  onReset,
  schemaLibrary,
  onLoadSchema,
}: SchemaActionsProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [saveMetadata, setSaveMetadata] = useState({
    description: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSave = () => {
    onSave();
    setIsSaveDialogOpen(false);
    setSaveMetadata({ description: "", tags: [] });
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !saveMetadata.tags.includes(tag.trim())) {
      setSaveMetadata((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSaveMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={!canSave || isLoading}
            className="relative"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
            {isDirty && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
              />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Schema</DialogTitle>
            <DialogDescription>
              Save your schema configuration with optional metadata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={saveMetadata.description}
                onChange={(e) =>
                  setSaveMetadata((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this schema configuration..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {saveMetadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Schema
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Schema Button */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Load Schema</DialogTitle>
            <DialogDescription>
              Choose a saved schema configuration to load
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {schemaLibrary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved schemas found</p>
                <p className="text-sm">Save a schema to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schemaLibrary.map((schema) => (
                  <Card
                    key={schema.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{schema.name}</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(schema.updatedAt)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {schema.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {schema.description}
                        </p>
                      )}
                      {schema.tags && schema.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {schema.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onLoadSchema(schema.id);
                          setIsLoadDialogOpen(false);
                        }}
                        className="w-full"
                      >
                        Load Schema
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onReset} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Schema
          </DropdownMenuItem>
          {onCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
