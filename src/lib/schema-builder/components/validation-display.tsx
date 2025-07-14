import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import {
  AlertCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface ValidationDisplayProps {
  errors: string[];
  fieldErrors: Record<string, string[]>;
  onClearErrors: () => void;
}

export function ValidationDisplay({
  errors,
  fieldErrors,
  onClearErrors,
}: ValidationDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalErrors = errors.length + Object.values(fieldErrors).flat().length;

  if (totalErrors === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-destructive/5 border-b border-destructive/20"
    >
      <div className="container">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto text-destructive hover:text-destructive"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {totalErrors} validation{" "}
                  {totalErrors === 1 ? "error" : "errors"}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {totalErrors}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            <div className="px-4 space-y-3">
              {/* General Errors */}
              {errors.length > 0 && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive text-sm">
                        Schema Errors
                      </span>
                    </div>
                    <ul className="space-y-1">
                      <AnimatePresence>
                        {errors.map((error, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-sm text-destructive flex items-center gap-2"
                          >
                            <span className="w-1 h-1 bg-destructive rounded-full" />
                            {error}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Field-specific Errors */}
              {Object.entries(fieldErrors).map(([fieldId, errors]) => {
                if (errors.length === 0) return null;

                return (
                  <Card
                    key={fieldId}
                    className="border-destructive/20 bg-destructive/5"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-destructive text-sm">
                          Field Errors
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {fieldId}
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        <AnimatePresence>
                          {errors.map((error, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="text-sm text-destructive flex items-center gap-2"
                            >
                              <span className="w-1 h-1 bg-destructive rounded-full" />
                              {error}
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Clear Errors Action */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearErrors}
                  className="text-destructive border-destructive/20 hover:bg-destructive/5"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Errors
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}
