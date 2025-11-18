import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setVerificationStatus("error");
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token xác thực",
        variant: "destructive",
      });
    } else {
      setToken(tokenParam);
    }
  }, [location, toast]);

  const verifyMutation = useMutation({
    mutationFn: async (verifyToken: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", { token: verifyToken });
      return await res.json();
    },
    onSuccess: () => {
      setVerificationStatus("success");
      toast({
        title: "Xác thực thành công!",
        description: "Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.",
      });
    },
    onError: (error: any) => {
      setVerificationStatus("error");
      toast({
        title: "Xác thực thất bại",
        description: error.message || "Token không hợp lệ hoặc đã hết hạn",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (token && verificationStatus === "loading") {
      verifyMutation.mutate(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              WFA Hub
            </h1>
          </div>
          <p className="text-slate-600">Xác thực email</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              {verificationStatus === "loading" && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                  Đang xác thực...
                </>
              )}
              {verificationStatus === "success" && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Xác thực thành công!
                </>
              )}
              {verificationStatus === "error" && (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Xác thực thất bại
                </>
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {verificationStatus === "loading" && "Vui lòng đợi trong giây lát..."}
              {verificationStatus === "success" && "Email của bạn đã được xác thực thành công"}
              {verificationStatus === "error" && "Không thể xác thực email của bạn"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationStatus === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8" data-testid="loading-state">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-cyan-600" />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Đang kiểm tra token xác thực...
                  </p>
                </div>
              )}

              {verificationStatus === "success" && (
                <div className="space-y-4" data-testid="success-state">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 text-center">
                      Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập để bắt đầu sử dụng WFA Hub.
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/login")}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                    data-testid="button-login"
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              )}

              {verificationStatus === "error" && (
                <div className="space-y-4" data-testid="error-state">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <p className="text-sm text-slate-600 text-center">
                      Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử đăng ký lại hoặc liên hệ hỗ trợ.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setLocation("/register")}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-register"
                    >
                      Đăng ký lại
                    </Button>
                    <Button
                      onClick={() => setLocation("/login")}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                      data-testid="button-login"
                    >
                      Đăng nhập
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
