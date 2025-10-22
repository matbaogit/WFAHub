import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Template, InsertTemplate } from "@shared/schema";
import { AdminRoute } from "@/components/admin-route";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTemplateSchema } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TemplateFormProps {
  form: any;
  onSubmit: (data: InsertTemplate) => void;
  isPending: boolean;
  onCancel: () => void;
}

function TemplateForm({ form, onSubmit, isPending, onCancel }: TemplateFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên (English)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Send Email" data-testid="input-template-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameVi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên (Tiếng Việt)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Gửi Email" data-testid="input-template-namevi" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả (English)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Send automated emails to customers" data-testid="input-template-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descriptionVi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả (Tiếng Việt)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Gửi email tự động cho khách hàng" data-testid="input-template-descriptionvi" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mail" data-testid="input-template-icon" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chi phí Tín dụng</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? 0 : parseInt(val));
                    }}
                    data-testid="input-template-creditcost" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="inputSchema"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Schema (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      field.onChange(parsed);
                    } catch {
                      field.onChange(e.target.value);
                    }
                  }}
                  placeholder='{"fields": [{"name": "email", "type": "string"}]}'
                  className="font-mono text-sm"
                  rows={6}
                  data-testid="input-template-inputschema"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạng thái</FormLabel>
              <FormControl>
                <select 
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1"
                  data-testid="select-template-isactive"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Tắt</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} data-testid="button-cancel-template">
            Hủy
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit-template">
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AdminTemplatesContent() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
  });

  const form = useForm<InsertTemplate>({
    resolver: zodResolver(insertTemplateSchema),
    defaultValues: {
      name: "",
      nameVi: "",
      description: "",
      descriptionVi: "",
      icon: "Zap",
      creditCost: 10,
      inputSchema: {},
      isActive: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTemplate) => {
      return await apiRequest("POST", "/api/admin/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Thành công",
        description: "Đã tạo template mới",
      });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTemplate & { id: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest("PATCH", `/api/admin/templates/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật template",
      });
      setEditingTemplate(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật template",
        variant: "destructive",
      });
    },
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
      setDeletingTemplate(null);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTemplate) => {
    if (editingTemplate) {
      updateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      nameVi: template.nameVi,
      description: template.description,
      descriptionVi: template.descriptionVi,
      icon: template.icon,
      creditCost: template.creditCost,
      inputSchema: template.inputSchema as any,
      isActive: template.isActive,
    });
  };

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
          onClick={() => {
            form.reset({
              name: "",
              nameVi: "",
              description: "",
              descriptionVi: "",
              icon: "Zap",
              creditCost: 10,
              inputSchema: {},
              isActive: 1,
            });
            setIsCreateOpen(true);
          }}
          data-testid="button-create-template"
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
          }`} data-testid={`card-template-${template.id}`}>
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
                    <h3 className="text-xl font-bold text-slate-900" data-testid={`text-template-name-${template.id}`}>{template.nameVi}</h3>
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
                      <span className="text-slate-500">tín dụng</span>
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
                  onClick={() => openEditDialog(template)}
                  className="rounded-xl"
                  data-testid={`button-edit-template-${template.id}`}
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
                  data-testid={`button-toggle-template-${template.id}`}
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
                  onClick={() => setDeletingTemplate(template)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  data-testid={`button-delete-template-${template.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Template Mới</DialogTitle>
            <DialogDescription>
              Tạo workflow automation template mới cho hệ thống
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            form={form}
            onSubmit={onSubmit}
            isPending={createMutation.isPending}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Template</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin workflow automation template
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            form={form}
            onSubmit={onSubmit}
            isPending={updateMutation.isPending}
            onCancel={() => setEditingTemplate(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa template "{deletingTemplate?.nameVi}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-template">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && deleteTemplateMutation.mutate(deletingTemplate.id)}
              data-testid="button-confirm-delete-template"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
