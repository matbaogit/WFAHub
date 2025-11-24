import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, CheckCircle2, AlertCircle, Mail, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SystemSmtpConfig {
  id?: string;
  userId: string;
  fromEmail: string;
  fromName: string;
  host: string;
  port: number;
  username: string;
  isSystemDefault: boolean;
}

export default function AdminSystemSmtp() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fromEmail: "",
    fromName: "",
    host: "",
    port: 587,
    username: "",
    password: "",
  });
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data: systemSmtp, isLoading } = useQuery<SystemSmtpConfig>({
    queryKey: ["/api/admin/system-smtp"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/system-smtp", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-smtp"] });
      toast({
        title: "Đã lưu cấu hình",
        description: "SMTP hệ thống đã được cập nhật thành công",
      });
      setFormData(prev => ({ ...prev, password: "" }));
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cấu hình SMTP",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async ({ recipientEmail, smtpConfig }: { recipientEmail: string; smtpConfig: typeof formData }) => {
      const res = await apiRequest("POST", "/api/admin/system-smtp/test", {
        recipientEmail,
        smtpConfig,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Email đã gửi thành công!",
        description: data.message || "Kiểm tra hộp thư của bạn",
      });
      setTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Không thể gửi email",
        description: error.message || "Vui lòng kiểm tra lại cấu hình SMTP",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email nhận test",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form fields before testing
    if (!formData.fromEmail || !formData.host || !formData.username) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin SMTP trước khi test",
        variant: "destructive",
      });
      return;
    }
    
    testEmailMutation.mutate({
      recipientEmail: testEmail,
      smtpConfig: formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasSystemSmtp = systemSmtp && systemSmtp.isSystemDefault;

  if (systemSmtp && !formData.fromEmail) {
    setFormData({
      fromEmail: systemSmtp.fromEmail,
      fromName: systemSmtp.fromName,
      host: systemSmtp.host,
      port: systemSmtp.port,
      username: systemSmtp.username,
      password: "",
    });
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
          <Server className="w-8 h-8 text-orange-600" />
          Cấu hình SMTP Hệ thống
        </h1>
        <p className="text-slate-600 mt-2">
          Cấu hình SMTP để gửi email xác thực tài khoản, reset mật khẩu và các email hệ thống
        </p>
      </div>

      {hasSystemSmtp ? (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            SMTP hệ thống đã được cấu hình và hoạt động. Email xác thực sẽ được gửi từ <strong>{systemSmtp.fromEmail}</strong>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Chưa có cấu hình SMTP hệ thống. Email xác thực và reset mật khẩu sẽ không hoạt động cho đến khi bạn cấu hình.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Thông tin SMTP
          </CardTitle>
          <CardDescription>
            Điền thông tin máy chủ SMTP để hệ thống có thể gửi email tự động
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email người gửi *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@company.com"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  required
                  data-testid="input-from-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">Tên người gửi *</Label>
                <Input
                  id="fromName"
                  placeholder="WFA Hub System"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  required
                  data-testid="input-from-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host *</Label>
                <Input
                  id="host"
                  placeholder="smtp.gmail.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                  data-testid="input-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="587"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  required
                  data-testid="input-port"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username (Email) *</Label>
              <Input
                id="username"
                type="email"
                placeholder="your-email@gmail.com"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {hasSystemSmtp ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={hasSystemSmtp ? "••••••••" : "Nhập mật khẩu ứng dụng"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!hasSystemSmtp}
                data-testid="input-password"
              />
              <p className="text-xs text-slate-500">
                {formData.host.includes('gmail') && 
                  "Với Gmail, sử dụng App Password thay vì mật khẩu thường. Tạo tại: https://myaccount.google.com/apppasswords"
                }
              </p>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestDialogOpen(true)}
                  disabled={testEmailMutation.isPending}
                  data-testid="button-test-email"
                >
                  {testEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test Email
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-smtp"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {hasSystemSmtp ? "Cập nhật" : "Lưu cấu hình"}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                💡 Nhấn "Test Email" để kiểm tra cấu hình trước khi lưu
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">💡 Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>• SMTP hệ thống được dùng để gửi email xác thực đăng ký và reset mật khẩu</p>
          <p>• Người dùng KHÔNG thể thấy hoặc thay đổi cấu hình này</p>
          <p>• Với Gmail: Bật 2FA và tạo App Password tại Google Account Security</p>
          <p>• Port phổ biến: 587 (TLS) hoặc 465 (SSL)</p>
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi Email Test</DialogTitle>
            <DialogDescription>
              Nhập email của bạn để kiểm tra cấu hình SMTP. Email test sẽ được gửi ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email nhận test</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTestEmail();
                  }
                }}
                data-testid="input-test-email"
              />
              <p className="text-xs text-slate-500">
                Kiểm tra hộp thư spam nếu không thấy email sau vài phút
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={testEmailMutation.isPending}
              data-testid="button-cancel-test"
            >
              Hủy
            </Button>
            <Button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending}
              data-testid="button-send-test"
            >
              {testEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi Email Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
