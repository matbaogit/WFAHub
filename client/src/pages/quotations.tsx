import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuotationSchema, type Quotation, type Customer } from "@shared/schema";
import { Plus, FileText, Calendar, DollarSign, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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
import { format } from "date-fns";

const quotationFormSchema = insertQuotationSchema
  .omit({ userId: true, quotationNumber: true, subtotal: true, vatAmount: true, total: true })
  .extend({
    items: z.array(
      z.object({
        name: z.string().min(1, "Tên sản phẩm/dịch vụ là bắt buộc"),
        description: z.string().default(""),
        quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
        unitPrice: z.number().min(0, "Đơn giá phải lớn hơn hoặc bằng 0"),
        sortOrder: z.number().default(0),
      })
    ).min(1, "Phải có ít nhất 1 sản phẩm/dịch vụ"),
  });

type QuotationFormData = z.infer<typeof quotationFormSchema>;

export default function Quotations() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();

  const { data: quotations, isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create quotation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setIsCreateOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo báo giá mới",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo báo giá",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuotationFormData }) => {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update quotation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setEditingQuotation(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật báo giá",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật báo giá",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quotation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDeletingQuotation(null);
      toast({
        title: "Thành công",
        description: "Đã xóa báo giá",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa báo giá",
        variant: "destructive",
      });
    },
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      customerId: "",
      title: "",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "",
      terms: "",
      discount: 0,
      vatRate: 10,
      status: "draft",
      items: [
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          sortOrder: 0,
        },
      ],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingQuotation) {
      form.reset({
        customerId: editingQuotation.customerId,
        title: editingQuotation.title,
        validUntil: new Date(editingQuotation.validUntil),
        notes: editingQuotation.notes || "",
        terms: editingQuotation.terms || "",
        discount: editingQuotation.discount,
        vatRate: editingQuotation.vatRate,
        status: editingQuotation.status,
        templateId: editingQuotation.templateId,
        emailTemplateId: editingQuotation.emailTemplateId,
        watermarkType: editingQuotation.watermarkType || "none",
        watermarkText: editingQuotation.watermarkText || "",
        autoExpire: editingQuotation.autoExpire !== undefined ? editingQuotation.autoExpire : 1,
        items: editingQuotation.items || [
          {
            name: "",
            description: "",
            quantity: 1,
            unitPrice: 0,
            sortOrder: 0,
          },
        ],
      });
    } else {
      form.reset({
        customerId: "",
        title: "",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "",
        terms: "",
        discount: 0,
        vatRate: 10,
        status: "draft",
        items: [
          {
            name: "",
            description: "",
            quantity: 1,
            unitPrice: 0,
            sortOrder: 0,
          },
        ],
      });
    }
  }, [editingQuotation, form]);

  const items = form.watch("items") || [];
  const discount = form.watch("discount") || 0;
  const vatRate = form.watch("vatRate") || 0;

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const vatAmount = Math.round(taxableAmount * (vatRate / 100));
  const total = Math.round(taxableAmount + vatAmount);

  const onSubmit = (data: QuotationFormData) => {
    const payload = {
      ...data,
      subtotal,
      vatAmount,
      total,
    };

    if (editingQuotation) {
      updateMutation.mutate({ id: editingQuotation.id, data: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const addItem = () => {
    const currentItems = form.getValues("items") || [];
    form.setValue("items", [
      ...currentItems,
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        sortOrder: currentItems.length,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items") || [];
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "Nháp", variant: "secondary" },
      sent: { label: "Đã gửi", variant: "default" },
      approved: { label: "Đã duyệt", variant: "default" },
      rejected: { label: "Từ chối", variant: "destructive" },
      expired: { label: "Hết hạn", variant: "outline" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Quản lý Báo giá
          </h1>
          <p className="text-muted-foreground mt-1">
            Tạo và quản lý các báo giá của bạn
          </p>
        </div>
        <Button 
          className="gap-2" 
          data-testid="button-create-quotation"
          onClick={() => {
            setEditingQuotation(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Tạo báo giá
        </Button>

        <Dialog open={isCreateOpen || !!editingQuotation} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingQuotation(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo báo giá mới</DialogTitle>
              <DialogDescription>
                Điền thông tin báo giá và thêm sản phẩm/dịch vụ
              </DialogDescription>
            </DialogHeader>
            <QuotationForm
              form={form}
              onSubmit={onSubmit}
              customers={customers || []}
              isPending={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
              items={items}
              addItem={addItem}
              removeItem={removeItem}
              subtotal={subtotal}
              discountAmount={discountAmount}
              vatAmount={vatAmount}
              total={total}
            />
          </DialogContent>
        </Dialog>
      </div>

      {quotations && quotations.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có báo giá</h3>
          <p className="text-muted-foreground mb-4">
            Tạo báo giá đầu tiên cho khách hàng
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-quotation">
            <Plus className="w-4 h-4 mr-2" />
            Tạo báo giá
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotations?.map((quotation) => {
            const customer = customers?.find((c) => c.id === quotation.customerId);
            return (
              <Card
                key={quotation.id}
                className="p-6 hover-elevate active-elevate-2"
                data-testid={`card-quotation-${quotation.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg" data-testid={`text-quotation-number-${quotation.id}`}>
                        {quotation.quotationNumber}
                      </h3>
                      {getStatusBadge(quotation.status)}
                    </div>
                    <p className="text-muted-foreground mb-1">{quotation.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng: {customer?.name || "N/A"}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Hết hạn: {format(new Date(quotation.validUntil), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-foreground">
                          {quotation.total.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        // Fetch full quotation with items
                        const response = await fetch(`/api/quotations/${quotation.id}`);
                        if (response.ok) {
                          const fullQuotation = await response.json();
                          setEditingQuotation(fullQuotation);
                        }
                      }}
                      data-testid={`button-edit-quotation-${quotation.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingQuotation(quotation)}
                      data-testid={`button-delete-quotation-${quotation.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deletingQuotation} onOpenChange={(open) => !open && setDeletingQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa báo giá "{deletingQuotation?.quotationNumber}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuotation && deleteMutation.mutate(deletingQuotation.id)}
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

function QuotationForm({
  form,
  onSubmit,
  customers,
  isPending,
  onCancel,
  items,
  addItem,
  removeItem,
  subtotal,
  discountAmount,
  vatAmount,
  total,
}: {
  form: any;
  onSubmit: any;
  customers: Customer[];
  isPending: boolean;
  onCancel: () => void;
  items: any[];
  addItem: () => void;
  removeItem: (index: number) => void;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Khách hàng *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hạn báo giá *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                          field.onChange(date);
                        }
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    data-testid="input-valid-until"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề báo giá *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Sản phẩm / Dịch vụ</h4>
            <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
              <Plus className="w-4 h-4 mr-1" />
              Thêm dòng
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Tên sản phẩm/dịch vụ" data-testid={`input-item-name-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Số lượng"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid={`input-item-quantity-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Đơn giá (VNĐ)"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid={`input-item-price-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    data-testid={`button-remove-item-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chiết khấu (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    data-testid="input-discount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vatRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thuế VAT (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    data-testid="input-vat-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span data-testid="text-subtotal">{subtotal.toLocaleString("vi-VN")} VNĐ</span>
            </div>
            <div className="flex justify-between">
              <span>Chiết khấu:</span>
              <span data-testid="text-discount">-{discountAmount.toLocaleString("vi-VN")} VNĐ</span>
            </div>
            <div className="flex justify-between">
              <span>Thuế VAT:</span>
              <span data-testid="text-vat">{vatAmount.toLocaleString("vi-VN")} VNĐ</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Tổng cộng:</span>
              <span className="text-primary" data-testid="text-total">
                {total.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú</FormLabel>
                <FormControl>
                  <Textarea {...field} data-testid="input-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Điều khoản</FormLabel>
                <FormControl>
                  <Textarea {...field} data-testid="input-terms" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="button-cancel"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Đang lưu..." : "Lưu báo giá"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
