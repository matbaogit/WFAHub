import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table as UITable,
  TableBody,
  TableCell as UITableCell,
  TableHead,
  TableHeader as UITableHeader,
  TableRow as UITableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, FileText } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import type { PolicyPage } from "@shared/schema";

const policySchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

type PolicyFormData = z.infer<typeof policySchema>;

export default function AdminPolicies() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyPage | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<PolicyPage | null>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [editorContent, setEditorContent] = useState("");

  const { data: policies, isLoading } = useQuery<PolicyPage[]>({
    queryKey: ["/api/admin/policies"],
  });

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      title: "",
      slug: "",
      isPublished: true,
      sortOrder: 0,
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[300px] prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none",
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PolicyFormData & { content: string }) => {
      return await apiRequest("POST", "/api/admin/policies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Thành công", description: "Đã tạo trang chính sách mới" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tạo trang chính sách",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PolicyFormData & { content: string }> }) => {
      return await apiRequest("PATCH", `/api/admin/policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Thành công", description: "Đã cập nhật trang chính sách" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trang chính sách",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Thành công", description: "Đã xóa trang chính sách" });
      setDeletingPolicy(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa trang chính sách",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: number }) => {
      return await apiRequest("PATCH", `/api/admin/policies/${id}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thay đổi trạng thái",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingPolicy(null);
    form.reset({
      title: "",
      slug: "",
      isPublished: true,
      sortOrder: 0,
    });
    setEditorContent("<p>Nhập nội dung trang chính sách ở đây...</p>");
    editor?.commands.setContent("<p>Nhập nội dung trang chính sách ở đây...</p>");
    setEditorTab("edit");
    setIsDialogOpen(true);
  };

  const openEditDialog = (policy: PolicyPage) => {
    setEditingPolicy(policy);
    form.reset({
      title: policy.title,
      slug: policy.slug,
      isPublished: policy.isPublished === 1,
      sortOrder: policy.sortOrder,
    });
    setEditorContent(policy.content);
    editor?.commands.setContent(policy.content);
    setEditorTab("edit");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPolicy(null);
    form.reset();
    setEditorContent("");
    editor?.commands.setContent("");
  };

  const onSubmit = (data: PolicyFormData) => {
    const content = editorContent;
    if (!content || content === "<p></p>") {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Nội dung trang không được để trống",
      });
      return;
    }

    if (editingPolicy) {
      updateMutation.mutate({
        id: editingPolicy.id,
        data: {
          ...data,
          isPublished: data.isPublished ? 1 : 0,
          content,
        } as any,
      });
    } else {
      createMutation.mutate({
        ...data,
        isPublished: data.isPublished ? 1 : 0,
        content,
      } as any);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Quản lý Trang Chính sách</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và quản lý các trang chính sách công khai
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="button-create-policy">
          <Plus className="w-4 h-4" />
          Tạo trang mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Danh sách trang chính sách
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!policies || policies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Chưa có trang chính sách nào</p>
              <Button onClick={openCreateDialog} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo trang đầu tiên
              </Button>
            </div>
          ) : (
            <UITable>
              <UITableHeader>
                <UITableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </UITableRow>
              </UITableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <UITableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                    <UITableCell className="font-medium">{policy.title}</UITableCell>
                    <UITableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">/policy/{policy.slug}</code>
                    </UITableCell>
                    <UITableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={policy.isPublished === 1}
                          onCheckedChange={(checked) =>
                            togglePublishMutation.mutate({
                              id: policy.id,
                              isPublished: checked ? 1 : 0,
                            })
                          }
                          data-testid={`switch-publish-${policy.id}`}
                        />
                        <Badge variant={policy.isPublished === 1 ? "default" : "secondary"}>
                          {policy.isPublished === 1 ? "Công khai" : "Ẩn"}
                        </Badge>
                      </div>
                    </UITableCell>
                    <UITableCell className="text-sm text-muted-foreground">
                      {policy.updatedAt
                        ? new Date(policy.updatedAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </UITableCell>
                    <UITableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/policy/${policy.slug}`, "_blank")}
                          title="Xem trang"
                          data-testid={`button-view-${policy.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(policy)}
                          title="Chỉnh sửa"
                          data-testid={`button-edit-${policy.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPolicy(policy)}
                          title="Xóa"
                          data-testid={`button-delete-${policy.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </UITableCell>
                  </UITableRow>
                ))}
              </TableBody>
            </UITable>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Chỉnh sửa trang chính sách" : "Tạo trang chính sách mới"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Điều khoản dịch vụ"
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingPolicy) {
                              form.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="dieu-khoan-dich-vu"
                          data-testid="input-slug"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-published"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Công khai</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="!mt-0">Thứ tự:</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-20"
                          data-testid="input-sort-order"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "edit" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
                    <TabsTrigger value="preview">Xem trước</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-2">
                    <div className="border rounded-md">
                      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          className={editor?.isActive("bold") ? "bg-muted" : ""}
                        >
                          B
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          className={editor?.isActive("italic") ? "bg-muted" : ""}
                        >
                          I
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleUnderline().run()}
                          className={editor?.isActive("underline") ? "bg-muted" : ""}
                        >
                          U
                        </Button>
                        <span className="w-px h-6 bg-border mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          className={editor?.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
                        >
                          H1
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={editor?.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
                        >
                          H2
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={editor?.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
                        >
                          H3
                        </Button>
                        <span className="w-px h-6 bg-border mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          className={editor?.isActive("bulletList") ? "bg-muted" : ""}
                        >
                          • List
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          className={editor?.isActive("orderedList") ? "bg-muted" : ""}
                        >
                          1. List
                        </Button>
                      </div>
                      <EditorContent editor={editor} />
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="mt-2">
                    <div className="border rounded-md p-4 min-h-[300px]">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: editorContent }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingPolicy
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPolicy} onOpenChange={() => setDeletingPolicy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa trang "{deletingPolicy?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPolicy && deleteMutation.mutate(deletingPolicy.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
