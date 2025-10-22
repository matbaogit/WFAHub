import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Template } from "@shared/schema";
import { LucideIcon, Sparkles } from "lucide-react";

interface TemplateCardProps {
  template: Template;
  icon: LucideIcon;
  onExecute: () => void;
}

export function TemplateCard({ template, icon: Icon, onExecute }: TemplateCardProps) {
  return (
    <Card className="group relative overflow-hidden p-8 border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/60 hover:-translate-y-2 transition-all duration-300 flex flex-col bg-gradient-to-br from-white to-slate-50/30">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 transition-all duration-300 pointer-events-none" />
      
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-bold mb-3 text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {template.nameVi}
        </h3>
        
        <p className="text-sm text-slate-600 mb-6 line-clamp-2 flex-1 leading-relaxed">
          {template.descriptionVi}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono font-bold text-blue-600">{template.creditCost}</span>
              <span className="text-xs text-slate-500">credits</span>
            </div>
          </div>
          
          <Button 
            onClick={onExecute}
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            data-testid={`button-run-${template.id}`}
          >
            Bắt đầu ngay
          </Button>
        </div>
      </div>
    </Card>
  );
}
