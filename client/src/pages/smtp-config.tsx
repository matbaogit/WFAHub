import { useQuery, useMutation } from "@tanstack/react-query";
import { Server, Edit, TestTube, Mail, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SmtpConfig, InsertSmtpConfig } from "@shared/schema";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSmtpConfigSchema } from "@shared/schema";

interface SmtpFormProps {
  form: any;
  onSubmit: (data: InsertSmtpConfig) => void;
  isPending: boolean;
  onCancel: () => void;
  isEditing?: boolean;
}

function SmtpConfigForm({ form, onSubmit, isPending, onCancel, isEditing }: SmtpFormProps) {
  const provider = form.watch("provider");

  useEffect(() => {
    if (provider === "matbao") {
      form.setValue("host", "smtp.matbao.net");
      form.setValue("port", 587);
    }
  }, [provider, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Loại mail</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="matbao" id="matbao" data-testid="radio-matbao" />
                    <Label htmlFor="matbao" className="font-normal cursor-pointer">
                      Mắt Bão mail (đơn giản)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="other" id="other" data-testid="radio-other" />
                    <Label htmlFor="other" className="font-normal cursor-pointer">
                      Mail nơi khác (cấu hình đầy đủ)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                {provider === "matbao" 
                  ? "Tự động cấu hình smtp.matbao.net - Chỉ cần nhập Email và Password" 
                  : "Cấu hình đầy đủ cho Gmail, Outlook hoặc SMTP khác"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {provider === "other" && (
          <>
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP Host</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="smtp.gmail.com" data-testid="input-smtp-host" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="587" 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-smtp-port" 
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Port 587 (STARTTLS) hoặc 465 (SSL)
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} placeholder="your-email@gmail.com" data-testid="input-smtp-username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="password" 
                  placeholder={isEditing ? "Để trống nếu không đổi" : "••••••••••••"}
                  data-testid="input-smtp-password" 
                />
              </FormControl>
              <FormMessage />
              {!isEditing && provider === "other" && (
                <FormDescription>
                  Gmail: Dùng App Password (không phải mật khẩu thường)
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fromEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email gửi đi</FormLabel>
              <FormControl>
                <Input {...field} placeholder="noreply@yourcompany.com" data-testid="input-smtp-fromemail" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fromName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên người gửi</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Công ty ABC" data-testid="input-smtp-fromname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} data-testid="button-cancel-smtp">
            Hủy
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit-smtp">
            {isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function SmtpConfiguration() {
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: config, isLoading } = useQuery<SmtpConfig | null>({
    queryKey: ["/api/smtp-config"],
  });

  const form = useForm<InsertSmtpConfig>({
    resolver: zodResolver(insertSmtpConfigSchema.omit({ userId: true })),
    defaultValues: {
      provider: "other",
      host: "",
      port: 587,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertSmtpConfig) => {
      return await apiRequest("POST", "/api/smtp-config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-config"] });
      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình SMTP",
      });
      setIsEditOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cấu hình SMTP",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (recipientEmail: string) => {
      return await apiRequest("POST", "/api/smtp-config/test", { 
        recipientEmail 
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã gửi email test thành công!",
      });
      setIsTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi kết nối SMTP",
        description: error.message || "Không thể gửi email test",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/smtp-config");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-config"] });
      toast({
        title: "Thành công",
        description: "Đã xóa cấu hình SMTP",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa cấu hình SMTP",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    if (!testEmail.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập email người nhận",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate(testEmail);
  };

  const onSubmit = (data: InsertSmtpConfig) => {
    if (config && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      saveMutation.mutate(dataWithoutPassword as InsertSmtpConfig);
    } else {
      saveMutation.mutate(data);
    }
  };

  const openEditDialog = () => {
    if (config) {
      form.reset({
        provider: config.provider || "other",
        host: config.host,
        port: config.port,
        username: config.username,
        password: "",
        fromEmail: config.fromEmail,
        fromName: config.fromName || "",
      });
    } else {
      form.reset({
        provider: "other",
        host: "",
        port: 587,
        username: "",
        password: "",
        fromEmail: "",
        fromName: "",
      });
    }
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-violet-600/10 border border-purple-500/20 text-purple-600 text-sm font-semibold mb-6 shadow-sm">
          <Server className="w-4 h-4" />
          <span>SMTP Configuration</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Cấu hình SMTP
        </h1>
        <p className="text-lg text-muted-foreground">
          Thiết lập máy chủ email để gửi báo giá và thông báo
        </p>
      </div>

      {!config ? (
        <Card className="p-12 text-center">
          <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có cấu hình SMTP</h3>
          <p className="text-muted-foreground mb-6">
            Thêm cấu hình SMTP để bắt đầu gửi email báo giá
          </p>
          <Button onClick={openEditDialog} data-testid="button-setup-smtp">
            <Server className="w-4 h-4 mr-2" />
            Thiết lập SMTP
          </Button>
        </Card>
      ) : (
        <Card className="p-8 bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200/60">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Server className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Thông tin SMTP</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-32">Loại mail:</span>
                    <span className="font-mono text-sm" data-testid="text-smtp-provider">
                      {config.provider === "matbao" ? "Mắt Bão mail" : "Mail nơi khác"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-32">Host:</span>
                    <span className="font-mono text-sm" data-testid="text-smtp-host">{config.host}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-32">Port:</span>
                    <span className="font-mono text-sm" data-testid="text-smtp-port">{config.port}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-32">Email:</span>
                    <span className="font-mono text-sm" data-testid="text-smtp-username">{config.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-32">Email gửi đi:</span>
                    <span className="font-mono text-sm" data-testid="text-smtp-fromemail">{config.fromEmail}</span>
                  </div>
                  {config.fromName && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-32">Tên người gửi:</span>
                      <span className="font-mono text-sm" data-testid="text-smtp-fromname">{config.fromName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTestDialogOpen(true)}
                disabled={testMutation.isPending}
                className="rounded-xl"
                data-testid="button-test-smtp"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testMutation.isPending ? "Đang gửi..." : "Test Email"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openEditDialog}
                className="rounded-xl"
                data-testid="button-edit-smtp"
              >
                <Edit className="w-4 h-4 mr-2" />
                Sửa
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
                className="rounded-xl text-destructive hover:bg-destructive/10"
                data-testid="button-delete-smtp"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>

          {config.provider === "other" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Hướng dẫn Gmail</h4>
                  <p className="text-sm text-blue-700">
                    1. Bật xác thực 2 bước cho tài khoản Gmail
                    <br />
                    2. Tạo App Password tại: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="underline">myaccount.google.com/apppasswords</a>
                    <br />
                    3. Sử dụng App Password thay vì mật khẩu thường
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{config ? "Chỉnh sửa cấu hình SMTP" : "Thiết lập SMTP"}</DialogTitle>
            <DialogDescription>
              Nhập thông tin máy chủ email để gửi báo giá
            </DialogDescription>
          </DialogHeader>
          <SmtpConfigForm
            form={form}
            onSubmit={onSubmit}
            isPending={saveMutation.isPending}
            onCancel={() => setIsEditOpen(false)}
            isEditing={!!config}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Email SMTP</DialogTitle>
            <DialogDescription>
              Nhập email người nhận để gửi thử nghiệm
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="test-email" className="text-sm font-medium">
                Email người nhận
              </label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                data-testid="input-test-email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTestDialogOpen(false);
                  setTestEmail("");
                }}
                disabled={testMutation.isPending}
                data-testid="button-cancel-test"
              >
                Hủy
              </Button>
              <Button
                onClick={handleTestEmail}
                disabled={testMutation.isPending}
                data-testid="button-send-test"
              >
                {testMutation.isPending ? "Đang gửi..." : "Gửi test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa cấu hình SMTP</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cấu hình SMTP này không? Hành động này không thể hoàn tác.
              Bạn sẽ cần thiết lập lại SMTP để gửi email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} data-testid="button-cancel-delete">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa cấu hình"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
