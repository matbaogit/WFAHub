import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Plus, Edit, Trash2, Power, PowerOff, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailTemplate, InsertEmailTemplate } from "@shared/schema";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailTemplateSchema } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TiptapEditor } from "@/components/TiptapEditor";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow as TiptapTableRow } from '@tiptap/extension-table-row';
import { TableCell as TiptapTableCell } from '@tiptap/extension-table-cell';
import { TableHeader as TiptapTableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import './tiptap-editor.css';

interface EmailTemplateFormProps {
  form: any;
  onSubmit: (data: InsertEmailTemplate) => void;
  isPending: boolean;
  onCancel: () => void;
  editor: any;
}

function EmailTemplateForm({ form, onSubmit, isPending, onCancel, editor }: EmailTemplateFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên template</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Báo giá sản phẩm" data-testid="input-emailtemplate-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề email</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Báo giá #{{quotationNumber}} - {{companyName}}" data-testid="input-emailtemplate-subject" />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Sử dụng biến: {`{{quotationNumber}}, {{companyName}}, {{customerName}}`}
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="htmlContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung HTML</FormLabel>
              <FormControl>
                <div data-testid="editor-emailtemplate-htmlcontent">
                  <TiptapEditor
                    editor={editor}
                    onImageUpload={async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData,
                      });
                      const data = await response.json();
                      return data.url;
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ HTML và biến động: {`{{quotationNumber}}, {{customerName}}, {{total}}, {{items}}`}
              </p>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    data-testid="select-emailtemplate-isactive"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tắt</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template mặc định</FormLabel>
                <FormControl>
                  <select 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1"
                    data-testid="select-emailtemplate-isdefault"
                  >
                    <option value={0}>Không</option>
                    <option value={1}>Mặc định</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} data-testid="button-cancel-emailtemplate">
            Hủy
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit-emailtemplate">
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function EmailTemplates() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates, isLoading } = useQuery<(EmailTemplate & { isAdminTemplate?: boolean })[]>({
    queryKey: ["/api/email-templates"],
  });

  const form = useForm<InsertEmailTemplate>({
    resolver: zodResolver(insertEmailTemplateSchema.omit({ createdBy: true })),
    defaultValues: {
      name: "",
      subject: "",
      htmlContent: "",
      isActive: 1,
      isDefault: 0,
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapTable.configure({
        resizable: true,
      }),
      TiptapTableRow,
      TiptapTableHeader,
      TiptapTableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Color,
      TextStyle,
    ],
    content: form.getValues('htmlContent') || '',
    onUpdate: ({ editor }) => {
      form.setValue('htmlContent', editor.getHTML(), { shouldValidate: true });
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentContent = form.getValues('htmlContent');
      if (editor.getHTML() !== currentContent) {
        editor.commands.setContent(currentContent || '');
      }
    }
  }, [form.watch('htmlContent'), editor]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmailTemplate) => {
      return await apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Thành công",
        description: "Đã tạo email template mới",
      });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo email template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertEmailTemplate & { id: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest("PATCH", `/api/email-templates/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật email template",
      });
      setEditingTemplate(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật email template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Thành công",
        description: "Đã xóa email template",
      });
      setDeletingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa email template",
        variant: "destructive",
      });
    },
  });

  const toggleShareMutation = useMutation({
    mutationFn: async ({ id, isSharedWithUsers }: { id: string; isSharedWithUsers: number }) => {
      return apiRequest("PATCH", `/api/email-templates/${id}`, { isSharedWithUsers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Đã cập nhật trạng thái chia sẻ!" });
    },
    onError: () => {
      toast({ title: "Lỗi khi cập nhật chia sẻ", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertEmailTemplate) => {
    if (editingTemplate) {
      updateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
          {[...Array(3)].map((_, i) => (
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 text-green-600 text-sm font-semibold mb-6 shadow-sm">
            <Mail className="w-4 h-4" />
            <span>Email Templates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Mẫu Email
          </h1>
          <p className="text-lg text-muted-foreground">
            Quản lý template email cho báo giá và thông báo
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 rounded-xl gap-2"
          onClick={() => {
            form.reset({
              name: "",
              subject: "",
              htmlContent: "",
              isActive: 1,
              isDefault: 0,
            });
            setIsCreateOpen(true);
          }}
          data-testid="button-create-emailtemplate"
        >
          <Plus className="w-4 h-4" />
          Thêm Template
        </Button>
      </div>

      {templates && templates.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có email template</h3>
          <p className="text-muted-foreground mb-4">
            Tạo template đầu tiên để gửi email báo giá
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-emailtemplate">
            <Plus className="w-4 h-4 mr-2" />
            Thêm Template
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates?.map((template) => (
            <Card 
              key={template.id} 
              className={`p-6 transition-all ${
                template.isActive === 1 
                  ? "bg-gradient-to-br from-white to-green-50/30 border-2 border-green-200/60" 
                  : "bg-gradient-to-br from-white to-slate-50/30 border-2 border-slate-200/60 opacity-60"
              }`}
              data-testid={`card-emailtemplate-${template.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    template.isActive === 1
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30"
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}>
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold" data-testid={`text-emailtemplate-name-${template.id}`}>
                        {template.name}
                      </h3>
                      {template.isDefault === 1 && (
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-blue-600 text-xs font-semibold">
                          Mặc định
                        </span>
                      )}
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
                      {template.isAdminTemplate && (
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-300 text-blue-600 text-xs font-semibold flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Từ Admin
                        </span>
                      )}
                      {isAdmin && template.isSharedWithUsers === 1 && (
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-green-300 text-green-600 text-xs font-semibold flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Đã chia sẻ
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Tiêu đề:</strong> {template.subject}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.htmlContent.replace(/<[^>]*>/g, '').slice(0, 150)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && !template.isAdminTemplate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isSharedWithUsers === 1}
                            onCheckedChange={(checked) => {
                              toggleShareMutation.mutate({
                                id: template.id,
                                isSharedWithUsers: checked ? 1 : 0
                              });
                            }}
                            disabled={toggleShareMutation.isPending}
                            data-testid={`switch-share-${template.id}`}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{template.isSharedWithUsers === 1 ? "Ngừng chia sẻ với người dùng" : "Chia sẻ với người dùng"}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {!template.isAdminTemplate && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(template)}
                        className="rounded-xl"
                        data-testid={`button-edit-emailtemplate-${template.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingTemplate(template)}
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        data-testid={`button-delete-emailtemplate-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Email Template Mới</DialogTitle>
            <DialogDescription>
              Tạo template email cho việc gửi báo giá và thông báo
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateForm
            form={form}
            onSubmit={onSubmit}
            isPending={createMutation.isPending}
            onCancel={() => setIsCreateOpen(false)}
            editor={editor}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Email Template</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin email template
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateForm
            form={form}
            onSubmit={onSubmit}
            isPending={updateMutation.isPending}
            onCancel={() => setEditingTemplate(null)}
            editor={editor}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa email template "{deletingTemplate?.name}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-emailtemplate">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate.id)}
              data-testid="button-confirm-delete-emailtemplate"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
