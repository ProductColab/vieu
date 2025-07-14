import { motion } from "framer-motion";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Info } from "lucide-react";

type Transport = "rest" | "server-actions";

interface EntityBasicInfoProps {
  name: string;
  description?: string;
  transport?: Transport;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTransportChange: (transport: Transport) => void;
}

export function EntityBasicInfo({
  name,
  description,
  transport,
  onNameChange,
  onDescriptionChange,
  onTransportChange,
}: EntityBasicInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <Label htmlFor="entity-name" className="text-sm font-medium">
          Name
        </Label>
        <Input
          id="entity-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Entity name"
          className="w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="entity-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="entity-description"
          value={description || ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
          className="w-48 min-h-0 h-8 resize-none"
          rows={1}
        />
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Label htmlFor="transport" className="text-sm font-medium">
                  Transport
                </Label>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose how data is transported between client and server</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Select
          value={transport || "server-actions"}
          onValueChange={onTransportChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="server-actions">Server Actions</SelectItem>
            <SelectItem value="rest">REST API</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}
