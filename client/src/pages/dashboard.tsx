import { useQuery } from "@tanstack/react-query";
import { Mail, FileText, Bell, CheckCircle, FileSignature, Sparkles, TrendingUp } from "lucide-react";
import type { Template } from "@shared/schema";
import { TemplateCard } from "@/components/template-card";
import { ExecutionModal } from "@/components/execution-modal";
import { Button } from "@/components/ui/button";
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
  
  const { data: templates, isLoading, isError, error, refetch } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>Tự động hóa thông minh</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Chào mừng trở lại!
        </h1>
        <p className="text-lg text-slate-600">
          Chọn tính năng tự động hóa để bắt đầu quy trình của bạn
        </p>
      </div>

      {isError ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-red-200/60 shadow-xl shadow-red-100/50">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900">Không thể tải tính năng</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải danh sách tính năng"}
          </p>
          <Button 
            onClick={() => refetch()} 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
            data-testid="button-retry-templates"
          >
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-br from-white to-slate-50/30 rounded-3xl p-8 animate-pulse border border-slate-200/60 shadow-lg"
            >
              <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-6" />
              <div className="h-7 bg-slate-200 rounded-xl mb-3 w-3/4" />
              <div className="h-5 bg-slate-200 rounded-lg w-full mb-2" />
              <div className="h-5 bg-slate-200 rounded-lg w-2/3 mb-6" />
              <div className="h-11 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 mx-auto mb-6 flex items-center justify-center">
            <FileText className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900">Chưa có tính năng</h3>
          <p className="text-slate-600">Không tìm thấy tính năng tự động hóa nào.</p>
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
