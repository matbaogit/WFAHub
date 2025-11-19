import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Lock, XCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password phải ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setTokenError(true);
      toast({
        title: "Lỗi đặt lại mật khẩu",
        description: "Không tìm thấy token đặt lại mật khẩu",
        variant: "destructive",
      });
    } else {
      setToken(tokenParam);
    }
  }, [location, toast]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      if (!token) {
        throw new Error("Token không hợp lệ");
      }
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Đặt lại mật khẩu thành công!",
        description: "Bạn có thể đăng nhập với mật khẩu mới.",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Đặt lại mật khẩu thất bại",
        description: error.message || "Token không hợp lệ hoặc đã hết hạn",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  if (tokenError) {
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
            <p className="text-slate-600">Đặt lại mật khẩu</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-red-600">
                <XCircle className="w-5 h-5" />
                Token không hợp lệ
              </CardTitle>
              <CardDescription className="text-center">
                Không thể đặt lại mật khẩu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="error-state">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setLocation("/forgot-password")}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-forgot-password"
                  >
                    Quên mật khẩu
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <p className="text-slate-600">Đặt lại mật khẩu</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Mật khẩu mới
            </CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            data-testid="input-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••"
                            data-testid="input-confirm-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-submit"
                >
                  {resetPasswordMutation.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600">Nhớ mật khẩu? </span>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 underline"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                Đăng nhập ngay
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
