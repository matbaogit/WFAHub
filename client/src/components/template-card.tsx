import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Template } from "@shared/schema";
import { LucideIcon } from "lucide-react";

interface TemplateCardProps {
  template: Template;
  icon: LucideIcon;
  onExecute: () => void;
}

export function TemplateCard({ template, icon: Icon, onExecute }: TemplateCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2 line-clamp-1">
        {template.nameVi}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
        {template.descriptionVi}
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="text-sm">
          <span className="font-mono font-semibold text-primary">{template.creditCost}</span>
          <span className="text-muted-foreground ml-1">credits</span>
        </div>
        <Button 
          onClick={onExecute}
          size="sm"
          data-testid={`button-run-${template.id}`}
        >
          Chạy ngay
        </Button>
      </div>
    </Card>
  );
}
