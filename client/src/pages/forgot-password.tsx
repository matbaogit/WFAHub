import { useEffect } from "react";
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
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Yêu cầu đã được gửi!",
        description: (
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 text-cyan-600" />
            <span>Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.</span>
          </div>
        ),
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gửi yêu cầu thất bại",
        description: error.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

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
          <p className="text-slate-600">Quên mật khẩu</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Đặt lại mật khẩu
            </CardTitle>
            <CardDescription>
              Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-submit"
                >
                  {forgotPasswordMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                <ArrowLeft className="w-3 h-3" />
                Quay lại đăng nhập
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
