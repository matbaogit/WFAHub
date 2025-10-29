import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Grip, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Variable {
  label: string;
  value: string;
}

interface VariablePickerProps {
  variables: Variable[];
  title?: string;
  description?: string;
  sampleData?: Record<string, string>;
}

export function VariablePicker({ 
  variables, 
  title = "Biến có sẵn",
  description = "Kéo và thả biến vào khung soạn thảo",
  sampleData = {}
}: VariablePickerProps) {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", variable.value);
    e.dataTransfer.setData("application/json", JSON.stringify(variable));
  };

  // Helper function to extract variable name from {variableName} format
  const getVariableName = (value: string) => {
    return value.replace(/[{}]/g, '');
  };

  // Helper function to get preview value for a variable
  const getPreviewValue = (variable: Variable): string => {
    const varName = getVariableName(variable.value);
    const previewValue = sampleData[varName];
    return previewValue || 'Không có dữ liệu mẫu';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Grip className="w-4 h-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{description}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-wrap gap-2">
            {variables.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Chưa có biến nào. Tải lên file CSV ở bước 1.
              </p>
            ) : (
              <TooltipProvider delayDuration={300}>
                {variables.map((variable, index) => {
                  const hasPreviewData = Object.keys(sampleData).length > 0;
                  const previewValue = getPreviewValue(variable);

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, variable)}
                          className="cursor-grab active:cursor-grabbing"
                          data-testid={`variable-chip-${index}`}
                        >
                          <Badge
                            variant="outline"
                            className="gap-2 hover-elevate active-elevate-2 select-none"
                          >
                            <Grip className="w-3 h-3 text-muted-foreground" />
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-mono font-semibold">
                                {variable.value}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {variable.label}
                              </span>
                            </div>
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      {hasPreviewData && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-primary">Dữ liệu mẫu:</p>
                            <p className="text-sm font-mono">{previewValue}</p>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
