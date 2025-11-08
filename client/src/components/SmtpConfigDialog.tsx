import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Server, TestTube, ExternalLink, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSmtpConfigSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SmtpConfig, InsertSmtpConfig } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmtpConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SmtpConfigDialog({ open, onOpenChange, onSuccess }: SmtpConfigDialogProps) {
  const { toast } = useToast();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data: config } = useQuery<SmtpConfig | null>({
    queryKey: ["/api/smtp-config"],
  });

  const form = useForm<InsertSmtpConfig>({
    resolver: zodResolver(insertSmtpConfigSchema.omit({ userId: true })),
    defaultValues: {
      host: config?.host || "",
      port: config?.port || 587,
      username: config?.username || "",
      password: "",
      fromEmail: config?.fromEmail || "",
      fromName: config?.fromName || "",
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
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              {config ? "Chỉnh sửa cấu hình SMTP" : "Thiết lập SMTP"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin máy chủ email để gửi chiến dịch báo giá
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Hướng dẫn cấu hình Gmail SMTP:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Bật xác thực 2 bước cho tài khoản Gmail</li>
                <li>Tạo App Password (không dùng mật khẩu thường)</li>
                <li>Sử dụng <code className="bg-blue-100 px-1 rounded">smtp.gmail.com</code> với port <code className="bg-blue-100 px-1 rounded">587</code></li>
              </ol>
              <a 
                href="https://wiki.matbao.net/kb/thong-tin-smtp-gmail-cach-cau-hinh-smtp-gmail-free-vao-wordpress/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-700 hover:text-blue-900 font-medium underline"
              >
                Xem hướng dẫn chi tiết
                <ExternalLink className="w-3 h-3" />
              </a>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <p className="text-xs text-muted-foreground">
                      Port 587 (STARTTLS) hoặc 465 (SSL)
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username / Email</FormLabel>
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
                    <FormLabel>Password / App Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder={config ? "Để trống nếu không đổi" : "••••••••••••"}
                        data-testid="input-smtp-password" 
                      />
                    </FormControl>
                    <FormMessage />
                    {!config && (
                      <p className="text-xs text-muted-foreground">
                        Gmail: Dùng App Password (không phải mật khẩu thường)
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Email</FormLabel>
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
                    <FormLabel>From Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Công ty ABC" data-testid="input-smtp-fromname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                {config && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsTestDialogOpen(true)} 
                    disabled={saveMutation.isPending}
                    data-testid="button-test-smtp-inline"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Email
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={saveMutation.isPending}
                  data-testid="button-cancel-smtp"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-submit-smtp">
                  {saveMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
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
    </>
  );
}
