import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer } from "@shared/schema";
import { Plus, UserCheck, Mail, Phone, Building, MapPin, Pencil, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function Customers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: any[]; errors: any[] } | null>(null);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create customer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo khách hàng mới",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo khách hàng",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update customer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật khách hàng",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật khách hàng",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete customer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeletingCustomer(null);
      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa khách hàng",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (customersData: any[]) => {
      const response = await fetch("/api/customers/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: customersData }),
      });
      if (!response.ok) throw new Error("Failed to import customers");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setImportResults(data);
      setIsImportDialogOpen(true);
      if (data.errors.length === 0) {
        toast({
          title: "Thành công",
          description: `Đã import ${data.success.length} khách hàng`,
        });
      } else {
        toast({
          title: "Import hoàn tất",
          description: `${data.success.length} thành công, ${data.errors.length} lỗi`,
          variant: data.success.length > 0 ? "default" : "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể import khách hàng",
        variant: "destructive",
      });
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Lỗi",
          description: "File CSV phải có ít nhất 2 dòng (header + data)",
          variant: "destructive",
        });
        return;
      }

      // Parse CSV header and normalize to lowercase
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Map common header variants to canonical field names
      const headerMap: Record<string, string> = {
        'name': 'name',
        'tên': 'name',
        'email': 'email',
        'phone': 'phone',
        'điện thoại': 'phone',
        'sđt': 'phone',
        'address': 'address',
        'địa chỉ': 'address',
        'company': 'company',
        'công ty': 'company',
        'taxcode': 'taxCode',
        'mã số thuế': 'taxCode',
        'notes': 'notes',
        'ghi chú': 'notes',
      };
      
      // Map CSV rows to customer objects
      const customers = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const customer: any = {};
        headers.forEach((header, index) => {
          const fieldName = headerMap[header] || header;
          customer[fieldName] = values[index]?.trim() || '';
        });
        return customer;
      });

      importMutation.mutate(customers);
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      taxCode: "",
      notes: "",
    },
  });

  const onSubmit = (data: any) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
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
            Quản lý Khách hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách khách hàng của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
            id="csv-upload"
            data-testid="input-csv-upload"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => document.getElementById('csv-upload')?.click()}
            disabled={importMutation.isPending}
            data-testid="button-import-csv"
          >
            <Upload className="w-4 h-4" />
            {importMutation.isPending ? "Đang import..." : "Import CSV"}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-customer">
                <Plus className="w-4 h-4" />
                Thêm khách hàng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm khách hàng mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin khách hàng vào form dưới đây
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                form={form}
                onSubmit={onSubmit}
                isPending={createMutation.isPending}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {customers && customers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có khách hàng</h3>
          <p className="text-muted-foreground mb-4">
            Tạo khách hàng đầu tiên để bắt đầu
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-customer">
            <Plus className="w-4 h-4 mr-2" />
            Thêm khách hàng
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers?.map((customer) => (
            <Card
              key={customer.id}
              className="p-6 hover-elevate active-elevate-2"
              data-testid={`card-customer-${customer.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1" data-testid={`text-customer-name-${customer.id}`}>
                    {customer.name}
                  </h3>
                  {customer.company && (
                    <p className="text-sm text-muted-foreground">
                      {customer.company}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCustomer(customer);
                      form.reset({
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone || "",
                        address: customer.address || "",
                        company: customer.company || "",
                        taxCode: customer.taxCode || "",
                        notes: customer.notes || "",
                      });
                    }}
                    data-testid={`button-edit-customer-${customer.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingCustomer(customer)}
                    data-testid={`button-delete-customer-${customer.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
                {customer.taxCode && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="w-4 h-4" />
                    <span>MST: {customer.taxCode}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khách hàng
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            form={form}
            onSubmit={onSubmit}
            isPending={updateMutation.isPending}
            onCancel={() => setEditingCustomer(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa khách hàng "{deletingCustomer?.name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
              data-testid="button-confirm-delete"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kết quả Import CSV</DialogTitle>
            <DialogDescription>
              Chi tiết kết quả import khách hàng từ file CSV
            </DialogDescription>
          </DialogHeader>
          {importResults && (
            <div className="space-y-4">
              {importResults.success.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">
                    ✓ Thành công: {importResults.success.length} khách hàng
                  </h4>
                  <div className="space-y-1 text-sm">
                    {importResults.success.slice(0, 5).map((item: any) => (
                      <div key={item.row} className="text-muted-foreground">
                        Dòng {item.row}: {item.customer.name}
                      </div>
                    ))}
                    {importResults.success.length > 5 && (
                      <div className="text-muted-foreground">
                        ... và {importResults.success.length - 5} khách hàng khác
                      </div>
                    )}
                  </div>
                </div>
              )}
              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-destructive mb-2">
                    ✗ Lỗi: {importResults.errors.length} dòng
                  </h4>
                  <div className="space-y-2 text-sm">
                    {importResults.errors.map((error: any) => (
                      <div key={error.row} className="border-l-2 border-destructive pl-3">
                        <div className="font-medium">Dòng {error.row}:</div>
                        <div className="text-muted-foreground">{error.error}</div>
                        {error.data && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Dữ liệu: {JSON.stringify(error.data)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setIsImportDialogOpen(false);
              setImportResults(null);
            }} data-testid="button-close-import-results">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerForm({
  form,
  onSubmit,
  isPending,
  onCancel,
}: {
  form: any;
  onSubmit: any;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên khách hàng *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-customer-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Công ty</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-company" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Textarea {...field} data-testid="input-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã số thuế</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-tax-code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
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
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
