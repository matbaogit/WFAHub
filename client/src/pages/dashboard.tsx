import { useQuery } from "@tanstack/react-query";
import { Mail, FileText, Bell, CheckCircle, FileSignature } from "lucide-react";
import type { Template } from "@shared/schema";
import { TemplateCard } from "@/components/template-card";
import { ExecutionModal } from "@/components/execution-modal";
import { useState } from "react";

const iconMap: Record<string, any> = {
  mail: Mail,
  fileText: FileText,
  bell: Bell,
  checkCircle: CheckCircle,
  fileSignature: FileSignature,
};

export default function Dashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Trang chủ</h1>
        <p className="text-muted-foreground">
          Chọn tính năng tự động hóa để bắt đầu
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="bg-card rounded-2xl p-6 animate-pulse"
            >
              <div className="w-12 h-12 bg-muted rounded-xl mb-4" />
              <div className="h-6 bg-muted rounded mb-2 w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-10 bg-muted rounded mt-4" />
            </div>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              icon={iconMap[template.icon] || FileText}
              onExecute={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có tính năng nào</h3>
          <p className="text-muted-foreground">
            Các tính năng tự động hóa sẽ xuất hiện tại đây
          </p>
        </div>
      )}

      {selectedTemplate && (
        <ExecutionModal
          template={selectedTemplate}
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
