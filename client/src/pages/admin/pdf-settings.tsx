import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, CheckCircle2, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PdfSettings {
  pdfGenerationMethod: 'puppeteer' | 'pdfco';
  hasPdfcoApiKey: boolean;
}

export default function AdminPdfSettings() {
  const { toast } = useToast();
  const [method, setMethod] = useState<'puppeteer' | 'pdfco'>('puppeteer');
  const [apiKey, setApiKey] = useState('');

  const { data: settings, isLoading } = useQuery<PdfSettings>({
    queryKey: ["/api/admin/pdf-settings"],
  });

  useEffect(() => {
    if (settings) {
      setMethod(settings.pdfGenerationMethod || 'puppeteer');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { pdfGenerationMethod: string; pdfcoApiKey?: string }) => {
      const res = await apiRequest("PUT", "/api/admin/pdf-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-settings"] });
      toast({
        title: "Đã lưu cài đặt",
        description: "Phương thức tạo PDF đã được cập nhật thành công",
      });
      setApiKey('');
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cài đặt PDF",
        variant: "destructive",
      });
    },
  });

  const testApiMutation = useMutation({
    mutationFn: async (testApiKey?: string) => {
      const res = await apiRequest("POST", "/api/admin/pdf-settings/test", { 
        apiKey: testApiKey || undefined 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test thành công",
          description: data.message,
        });
      } else {
        toast({
          title: "Test thất bại",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể test API",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (method === 'pdfco' && !settings?.hasPdfcoApiKey && !apiKey) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key của PDF.co",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate({
      pdfGenerationMethod: method,
      pdfcoApiKey: apiKey || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
          <FileText className="w-8 h-8 text-orange-600" />
          Cài đặt Tạo PDF
        </h1>
        <p className="text-slate-600 mt-2">
          Cấu hình phương thức tạo file PDF đính kèm trong email campaign
        </p>
      </div>

      {settings?.pdfGenerationMethod === 'pdfco' && settings.hasPdfcoApiKey ? (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Đang sử dụng <strong>PDF.co API</strong> để tạo PDF. API Key đã được cấu hình.
          </AlertDescription>
        </Alert>
      ) : settings?.pdfGenerationMethod === 'puppeteer' ? (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Đang sử dụng <strong>Puppeteer (Local)</strong> để tạo PDF. Yêu cầu Chromium được cài đặt trên server.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Chưa cấu hình phương thức tạo PDF. Mặc định sẽ sử dụng Puppeteer (yêu cầu Chromium).
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Phương thức tạo PDF
          </CardTitle>
          <CardDescription>
            Chọn phương thức tạo file PDF cho báo giá đính kèm trong email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup 
              value={method} 
              onValueChange={(value) => setMethod(value as 'puppeteer' | 'pdfco')}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="puppeteer" id="puppeteer" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="puppeteer" className="text-base font-medium cursor-pointer">
                    Puppeteer (Local)
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    Sử dụng Chromium trên server để render PDF. Miễn phí nhưng yêu cầu cài đặt Chromium.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Phù hợp cho: Replit deployment, VPS có cài Chromium
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="pdfco" id="pdfco" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="pdfco" className="text-base font-medium cursor-pointer">
                    PDF.co API (Cloud)
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    Sử dụng dịch vụ PDF.co để tạo PDF từ HTML. Không cần cài đặt gì trên server.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Phù hợp cho: Server không có Chromium, shared hosting
                  </p>
                  <a 
                    href="https://pdf.co/signup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                  >
                    Đăng ký PDF.co (miễn phí 100 PDF/tháng)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </RadioGroup>

            {method === 'pdfco' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <Label htmlFor="apiKey">
                  PDF.co API Key {settings?.hasPdfcoApiKey ? "(để trống nếu không đổi)" : "*"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={settings?.hasPdfcoApiKey ? "••••••••" : "Nhập API Key từ PDF.co"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    data-testid="input-pdfco-api-key"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testApiMutation.mutate(apiKey || undefined)}
                    disabled={testApiMutation.isPending || (!apiKey && !settings?.hasPdfcoApiKey)}
                    data-testid="button-test-api"
                  >
                    {testApiMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-1" />
                        Test API
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Lấy API Key tại: Settings → API Key trong dashboard PDF.co
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full"
                data-testid="button-save-pdf-settings"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Lưu cài đặt
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">So sánh các phương thức</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Tiêu chí</th>
                  <th className="text-left py-2 px-3">Puppeteer</th>
                  <th className="text-left py-2 px-3">PDF.co</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Chi phí</td>
                  <td className="py-2 px-3">Miễn phí</td>
                  <td className="py-2 px-3">100 PDF miễn phí/tháng</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Yêu cầu server</td>
                  <td className="py-2 px-3">Cần Chromium</td>
                  <td className="py-2 px-3">Không yêu cầu</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Tốc độ</td>
                  <td className="py-2 px-3">Nhanh</td>
                  <td className="py-2 px-3">Phụ thuộc mạng</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Độ ổn định</td>
                  <td className="py-2 px-3">Phụ thuộc cấu hình server</td>
                  <td className="py-2 px-3">Rất ổn định</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
