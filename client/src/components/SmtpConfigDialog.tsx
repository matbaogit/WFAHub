import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Server, TestTube, ExternalLink, AlertCircle, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSmtpConfigSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SmtpConfig, InsertSmtpConfig } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface SmtpConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SmtpConfigDialog({ open, onOpenChange, onSuccess }: SmtpConfigDialogProps) {
  const { toast } = useToast();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [detectedServer, setDetectedServer] = useState<string | null>(null);

  const { data: config } = useQuery<SmtpConfig | null>({
    queryKey: ["/api/smtp-config"],
  });

  const form = useForm<InsertSmtpConfig>({
    resolver: zodResolver(insertSmtpConfigSchema.omit({ userId: true })),
    defaultValues: {
      provider: config?.provider || "other",
      host: config?.host || "",
      port: config?.port || 587,
      username: config?.username || "",
      password: "",
      fromEmail: config?.fromEmail || "",
      fromName: config?.fromName || undefined,
    },
  });

  const provider = form.watch("provider");

  useEffect(() => {
    if (provider === "matbao" && !detectedServer) {
      form.setValue("host", "smtp.matbao.net");
      form.setValue("port", 587);
    }
  }, [provider, form, detectedServer]);

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/smtp-config");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-config"] });
      toast({
        title: "Đã xóa",
        description: "Đã xóa cấu hình SMTP",
      });
      form.reset({
        host: "",
        port: 587,
        username: "",
        password: "",
        fromEmail: "",
        fromName: undefined,
      });
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa cấu hình SMTP",
        variant: "destructive",
      });
    },
  });

  const handleEmailBlur = async (email: string) => {
    if (!email) return;
    
    const emailMatch = email.match(/@(.+)$/);
    if (!emailMatch) return;
    
    const domain = emailMatch[1];
    setIsCheckingEmail(true);
    setDetectedServer(null);
    
    try {
      // Call Mat Bao API directly from frontend
      const response = await fetch("https://matbao.support/api/get-mx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract SMTP hostname from response (response is an array)
        if (Array.isArray(data) && data.length > 0 && data[0].hostname) {
          const smtpHost = data[0].hostname;
          setDetectedServer(smtpHost);
          form.setValue("host", smtpHost);
          form.setValue("port", 587);
          toast({
            title: "Đã phát hiện server",
            description: `Server email: ${smtpHost}`,
          });
        } else {
          setDetectedServer(null);
          form.setValue("host", "smtp.matbao.net");
          form.setValue("port", 587);
          toast({
            title: "Không tìm thấy server",
            description: "Sử dụng mặc định smtp.matbao.net",
          });
        }
      } else {
        setDetectedServer(null);
        form.setValue("host", "smtp.matbao.net");
        form.setValue("port", 587);
      }
    } catch (error) {
      console.error("Error checking email service:", error);
      setDetectedServer(null);
      form.setValue("host", "smtp.matbao.net");
      form.setValue("port", 587);
    } finally {
      setIsCheckingEmail(false);
    }
  };

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
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="your-email@gmail.com" 
                          data-testid="input-smtp-username"
                          onBlur={(e) => handleEmailBlur(e.target.value)}
                        />
                        {isCheckingEmail && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {detectedServer && !isCheckingEmail && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {detectedServer && provider === "other" && (
                      <FormDescription className="text-green-600">
                        ✓ Đã phát hiện server: {detectedServer}
                      </FormDescription>
                    )}
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
                        placeholder={config ? "Để trống nếu không đổi" : "••••••••••••"}
                        data-testid="input-smtp-password" 
                      />
                    </FormControl>
                    <FormMessage />
                    {!config && provider === "other" && (
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
                      <Input {...field} value={field.value || ""} placeholder="Công ty ABC" data-testid="input-smtp-fromname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center gap-2 pt-4">
                <div>
                  {config && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => setIsDeleteDialogOpen(true)} 
                      disabled={saveMutation.isPending || deleteMutation.isPending}
                      data-testid="button-delete-smtp"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa cấu hình
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {config && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsTestDialogOpen(true)} 
                      disabled={saveMutation.isPending || deleteMutation.isPending}
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
                    disabled={saveMutation.isPending || deleteMutation.isPending}
                    data-testid="button-cancel-smtp"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending || deleteMutation.isPending} data-testid="button-submit-smtp">
                    {saveMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                  </Button>
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa cấu hình SMTP</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cấu hình SMTP hiện tại? 
              Hành động này không thể hoàn tác và bạn sẽ cần cấu hình lại từ đầu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteMutation.isPending}
              data-testid="button-cancel-delete-smtp"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-smtp"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa cấu hình"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
