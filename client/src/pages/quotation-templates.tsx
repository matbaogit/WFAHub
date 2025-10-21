import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuotationTemplateSchema, type QuotationTemplate } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = insertQuotationTemplateSchema.extend({
  name: z.string().min(1, "Tên template không được để trống"),
  htmlContent: z.string().min(1, "Nội dung HTML không được để trống"),
});

type FormData = z.infer<typeof formSchema>;

// Sample preview data
const SAMPLE_DATA = {
  quotationNumber: "BG-2024-001",
  companyName: "Công ty ABC",
  customerName: "Nguyễn Văn A",
  customerCompany: "Công ty XYZ",
  total: "50,000,000 ₫",
  items: `
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Dịch vụ tư vấn</td>
      <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">10</td>
      <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">2,000,000 ₫</td>
      <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">20,000,000 ₫</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Thiết kế website</td>
      <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">1</td>
      <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">30,000,000 ₫</td>
      <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">30,000,000 ₫</td>
    </tr>
  `.trim(),
  validUntil: "31/12/2024",
  notes: "Báo giá có hiệu lực trong 30 ngày.",
};

function renderPreview(html: string): string {
  let rendered = html;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

export default function QuotationTemplates() {
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery<QuotationTemplate[]>({
    queryKey: ["/api/quotation-templates"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      htmlContent: "",
      isActive: 1,
      isDefault: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/quotation-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Template đã được tạo thành công!" });
    },
    onError: () => {
      toast({ title: "Lỗi khi tạo template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      return apiRequest("PATCH", `/api/quotation-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
      toast({ title: "Template đã được cập nhật!" });
    },
    onError: () => {
      toast({ title: "Lỗi khi cập nhật template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/quotation-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
      toast({ title: "Template đã được xóa!" });
    },
    onError: () => {
      toast({ title: "Lỗi khi xóa template", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: QuotationTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      htmlContent: template.htmlContent,
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      description: "",
      htmlContent: "",
      isActive: 1,
      isDefault: 0,
    });
    setIsDialogOpen(true);
  };

  const htmlContent = form.watch("htmlContent");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tệp đính kèm</h1>
          <p className="text-muted-foreground mt-1">Quản lý mẫu tệp đính kèm</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Tạo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Chỉnh sửa Template" : "Tạo Template Mới"}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" data-testid="tab-editor">
                  <FileText className="w-4 h-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4 mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên Template</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="VD: Template cơ bản" 
                                data-testid="input-template-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả (tùy chọn)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ""}
                                placeholder="Mô tả ngắn về template" 
                                data-testid="input-template-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="htmlContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nội dung HTML</FormLabel>
                          <FormDescription className="space-y-2">
                            <div className="text-sm">
                              <p className="font-medium mb-1">Biến có sẵn:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
                                <code className="bg-muted px-2 py-1 rounded">{'{{quotationNumber}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{companyName}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{customerName}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{customerCompany}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{total}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{items}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{validUntil}}'}</code>
                                <code className="bg-muted px-2 py-1 rounded">{'{{notes}}'}</code>
                              </div>
                            </div>
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Nhập HTML template..."
                              className="font-mono text-sm min-h-[400px]"
                              data-testid="textarea-html-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Kích hoạt</FormLabel>
                              <FormDescription>Template có thể sử dụng</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                data-testid="switch-is-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Mặc định</FormLabel>
                              <FormDescription>Sử dụng làm template mặc định</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                data-testid="switch-is-default"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingTemplate(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Hủy
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-template"
                      >
                        {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Lưu Template"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Xem trước Template
                    </CardTitle>
                    <CardDescription>
                      Dữ liệu mẫu được sử dụng để hiển thị preview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded-lg p-6 bg-background min-h-[400px]"
                      dangerouslySetInnerHTML={{ __html: renderPreview(htmlContent || "") }}
                      data-testid="preview-content"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Chưa có template nào</p>
            <Button onClick={handleCreate} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Tạo Template Đầu Tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault === 1 && (
                        <Badge variant="default" data-testid="badge-default">Mặc định</Badge>
                      )}
                      {template.isActive === 0 && (
                        <Badge variant="secondary" data-testid="badge-inactive">Không hoạt động</Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Bạn có chắc muốn xóa template này?")) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
