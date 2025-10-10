import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Template } from "@shared/schema";
import { AdminRoute } from "@/components/admin-route";

function AdminTemplatesContent() {
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: number }) => {
      return await apiRequest("PATCH", `/api/admin/templates/${id}`, { 
        isActive: isActive === 1 ? 0 : 1 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái template",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Thành công",
        description: "Đã xóa template",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa template",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 text-purple-600 text-sm font-semibold mb-6 shadow-sm">
            <Zap className="w-4 h-4" />
            <span>Quản lý Templates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Workflow Templates
          </h1>
          <p className="text-lg text-slate-600">
            Quản lý tất cả automation templates trong hệ thống
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 rounded-xl"
          onClick={() => toast({ title: "Tính năng đang phát triển", description: "Chức năng thêm template mới sẽ sớm có" })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Template
        </Button>
      </div>

      <div className="space-y-4">
        {templates?.map((template) => (
          <Card key={template.id} className={`bg-gradient-to-br from-white to-slate-50/30 border-2 shadow-lg p-6 transition-all ${
            template.isActive === 1 
              ? "border-purple-200/60" 
              : "border-slate-200/60 opacity-60"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  template.isActive === 1
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30"
                    : "bg-gradient-to-br from-slate-400 to-slate-500"
                }`}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{template.nameVi}</h3>
                    {template.isActive === 1 ? (
                      <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 text-green-600 text-xs font-semibold flex items-center gap-1">
                        <Power className="w-3 h-3" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-1">
                        <PowerOff className="w-3 h-3" />
                        Tắt
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mb-3">{template.descriptionVi}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                      <span className="text-slate-600">Chi phí:</span>
                      <span className="font-mono font-bold text-blue-600">{template.creditCost}</span>
                      <span className="text-slate-500">credits</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">
                      ID: <span className="font-mono text-xs">{template.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast({ title: "Tính năng đang phát triển", description: "Chức năng chỉnh sửa sẽ sớm có" })}
                  className="rounded-xl"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant={template.isActive === 1 ? "outline" : "default"}
                  onClick={() => toggleTemplateMutation.mutate({ 
                    id: template.id, 
                    isActive: template.isActive 
                  })}
                  className={template.isActive === 1 
                    ? "rounded-xl" 
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl"
                  }
                >
                  {template.isActive === 1 ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Tắt
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Bật
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn xóa template này?")) {
                      deleteTemplateMutation.mutate(template.id);
                    }
                  }}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  return (
    <AdminRoute>
      <AdminTemplatesContent />
    </AdminRoute>
  );
}
