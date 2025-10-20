import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ColumnMappingTable from "@/components/ColumnMappingTable";
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  Send, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Zap
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WizardStep = 1 | 2 | 3 | 4;

interface ParsedRecipient {
  email: string;
  name?: string;
  customData?: Record<string, any>;
}

interface QuotationTemplate {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

interface FilePreviewData {
  headers: string[];
  preview: Array<Record<string, any>>;
  totalRows: number;
  autoMapping: Record<string, string>;
}

export default function BulkCampaignWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [campaignName, setCampaignName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendRate, setSendRate] = useState(50);
  const [showMappingView, setShowMappingView] = useState(false);

  const { data: quotationTemplates = [] } = useQuery<QuotationTemplate[]>({
    queryKey: ["/api/quotation-templates"],
  });

  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const { data: smtpConfig } = useQuery({
    queryKey: ["/api/smtp-config"],
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/bulk-campaigns/parse-recipients", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      setFilePreview({
        headers: data.headers,
        preview: data.preview,
        totalRows: data.totalRows,
        autoMapping: data.autoMapping || {}
      });
      setColumnMapping(data.autoMapping || {});
      setShowMappingView(true);
      toast({
        title: "Tải file thành công",
        description: `Tìm thấy ${data.totalRows} dòng dữ liệu`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Tải file thất bại",
        description: error.message || "Không thể phân tích file. Vui lòng kiểm tra định dạng.",
      });
    },
  });

  const applyMappingMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedFile) throw new Error("No file uploaded");
      
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("mapping", JSON.stringify(columnMapping));
      
      const response = await fetch("/api/bulk-campaigns/apply-mapping", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Mapping failed");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      setParsedRecipients(data.recipients || []);
      toast({
        title: "Áp dụng mapping thành công",
        description: `Đã parse ${data.totalCount} người nhận`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Áp dụng mapping thất bại",
        description: error.message,
      });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const campaignRes = await apiRequest("POST", "/api/bulk-campaigns", data);
      const campaign = await campaignRes.json();
      
      await apiRequest(
        "POST",
        `/api/bulk-campaigns/${campaign.id}/recipients`,
        { recipients: parsedRecipients }
      );

      await apiRequest("POST", `/api/bulk-campaigns/${campaign.id}/send`, {});

      return campaign;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });

      toast({
        title: "Chiến dịch đã tạo!",
        description: "Chiến dịch báo giá hàng loạt đã bắt đầu.",
      });

      navigate("/bulk-campaigns");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Tạo chiến dịch thất bại",
        description: "Vui lòng thử lại.",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      uploadMutation.mutate(file);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && parsedRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Chưa có người nhận",
        description: "Vui lòng tải lên file danh sách người nhận.",
      });
      return;
    }

    if (currentStep === 2 && !selectedTemplateId) {
      toast({
        variant: "destructive",
        title: "Chưa chọn mẫu",
        description: "Vui lòng chọn mẫu báo giá.",
      });
      return;
    }

    if (currentStep === 3 && (!emailSubject || !emailBody)) {
      toast({
        variant: "destructive",
        title: "Email chưa đầy đủ",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung thư.",
      });
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleSubmit = () => {
    if (!campaignName.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu tên chiến dịch",
        description: "Vui lòng đặt tên cho chiến dịch.",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      emailSubject,
      emailBody,
      quotationTemplateId: selectedTemplateId || null,
      sendRate,
      userId: user?.id,
    });
  };

  const selectedTemplate = quotationTemplates.find(t => t.id === selectedTemplateId);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background text-muted-foreground"
              }`}
              data-testid={`step-indicator-${step}`}
            >
              {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            <span className="text-xs mt-2 text-muted-foreground">
              {step === 1 && "Nhập"}
              {step === 2 && "Mẫu"}
              {step === 3 && "Thư"}
              {step === 4 && "Xem lại"}
            </span>
          </div>
          {step < 4 && (
            <div
              className={`h-0.5 flex-1 mx-2 ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => {
    const handleApplyMapping = async () => {
      console.log("[DEBUG] Current columnMapping state:", columnMapping);
      console.log("[DEBUG] columnMapping.email:", columnMapping.email);
      
      if (!columnMapping.email || columnMapping.email === "NONE") {
        toast({
          variant: "destructive",
          title: "Thiếu cột Email",
          description: "Vui lòng chọn cột Email (bắt buộc)",
        });
        return;
      }
      await applyMappingMutation.mutateAsync();
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">
            Nhập danh sách người nhận
          </h2>
          <p className="text-sm text-muted-foreground">
            {!showMappingView 
              ? "Tải lên file Excel hoặc CSV chứa thông tin người nhận"
              : `File: ${uploadedFile?.name} (${filePreview?.totalRows} dòng)`
            }
          </p>
        </div>

        {!showMappingView ? (
          <Card className="border-dashed hover-elevate">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {uploadedFile
                    ? `Đã chọn: ${uploadedFile.name}`
                    : "Nhấn để tải lên file Excel hoặc CSV"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  data-testid="button-select-file"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? "Đang tải lên..." : "Chọn file"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mapping cột dữ liệu</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowMappingView(false);
                    setFilePreview(null);
                    setUploadedFile(null);
                    setParsedRecipients([]);
                  }}
                  data-testid="button-change-file"
                >
                  Đổi file
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!columnMapping.email && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vui lòng chọn cột Email (bắt buộc)
                  </AlertDescription>
                </Alert>
              )}
              
              <ColumnMappingTable
                headers={filePreview?.headers || []}
                preview={filePreview?.preview || []}
                mapping={columnMapping}
                onMappingChange={(field, column) => {
                  setColumnMapping((prev) => ({ ...prev, [field]: column }));
                }}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleApplyMapping}
                  disabled={!columnMapping.email || columnMapping.email === "NONE" || applyMappingMutation.isPending}
                  data-testid="button-apply-mapping"
                >
                  {applyMappingMutation.isPending ? "Đang xử lý..." : "Áp dụng mapping"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {parsedRecipients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Đã parse thành công ({parsedRecipients.length} người nhận)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Dữ liệu tùy chỉnh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRecipients.slice(0, 10).map((recipient, idx) => (
                      <TableRow key={idx} data-testid={`row-recipient-${idx}`}>
                        <TableCell>{recipient.email}</TableCell>
                        <TableCell>{recipient.name || "-"}</TableCell>
                        <TableCell>
                          {recipient.customData && Object.keys(recipient.customData).length > 0 ? (
                            <Badge variant="secondary">
                              {Object.keys(recipient.customData).length} trường
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedRecipients.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Hiển thị 10 trong số {parsedRecipients.length} người nhận
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Chọn mẫu báo giá</h2>
        <p className="text-sm text-muted-foreground">
          Chọn mẫu để tạo báo giá cá nhân hóa cho từng người nhận
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-select">Mẫu báo giá</Label>
            <Select
              value={selectedTemplateId || ""}
              onValueChange={(value) => setSelectedTemplateId(value)}
            >
              <SelectTrigger id="template-select" data-testid="select-quotation-template">
                <SelectValue placeholder="-- Chọn mẫu báo giá --" />
              </SelectTrigger>
              <SelectContent>
                {quotationTemplates.map((template) => (
                  <SelectItem 
                    key={template.id} 
                    value={template.id}
                    data-testid={`option-template-${template.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {quotationTemplates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Không tìm thấy mẫu báo giá nào. Vui lòng tạo mẫu trước.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Xem trước mẫu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-muted/30 max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep3 = () => {
    const selectedEmailTemplate = emailTemplates.find((t) => t.id === selectedEmailTemplateId);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Soạn thư</h2>
          <p className="text-sm text-muted-foreground">
            Chọn mẫu email hoặc nhập tiêu đề và nội dung thư. Sử dụng các trường merge như {`{name}`}, {`{email}`}, {`{company}`}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-template-select">Mẫu email (không bắt buộc)</Label>
              <Select
                value={selectedEmailTemplateId}
                onValueChange={(value) => {
                  setSelectedEmailTemplateId(value);
                  const template = emailTemplates.find((t) => t.id === value);
                  if (template) {
                    setEmailSubject(template.subject);
                    setEmailBody(template.htmlContent);
                  }
                }}
              >
                <SelectTrigger id="email-template-select" data-testid="select-email-template">
                  <SelectValue placeholder="-- Chọn mẫu email --" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template) => (
                    <SelectItem 
                      key={template.id} 
                      value={template.id}
                      data-testid={`option-email-template-${template.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chọn mẫu để tự động điền tiêu đề và nội dung
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Tiêu đề thư</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Báo giá dành riêng cho {name}"
                data-testid="input-email-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-body">Nội dung thư</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Xin chào {name},&#10;&#10;Chúng tôi gửi đến bạn báo giá chi tiết...&#10;&#10;Trân trọng."
                rows={12}
                data-testid="input-email-body"
              />
              <p className="text-xs text-muted-foreground">
                Gợi ý: Sử dụng các trường merge từ file Excel: {`{name}`}, {`{email}`}, {`{company}`}, v.v.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xem trước thư</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Tiêu đề:</p>
                <p className="font-medium">{emailSubject || "Chưa có tiêu đề"}</p>
              </div>
              <div className="p-3 border rounded-md bg-muted/30 min-h-32 max-h-96 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-1">Nội dung:</p>
                {emailBody.startsWith('<') ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: emailBody }} />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{emailBody || "Chưa có nội dung"}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Xem lại & Gửi</h2>
        <p className="text-sm text-muted-foreground">
          Xem lại cài đặt chiến dịch và gửi
        </p>
      </div>

      {!smtpConfig && (
        <Alert variant="destructive" data-testid="alert-smtp-not-configured">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chưa cấu hình SMTP! Vui lòng{" "}
            <a 
              href="/smtp-config" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-destructive-foreground"
              data-testid="link-smtp-config"
            >
              cấu hình SMTP ngay
            </a>
            {" "}để gửi email.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cài đặt chiến dịch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Tên chiến dịch</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Khuyến mãi tháng 10/2025"
              data-testid="input-campaign-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-rate">Tốc độ gửi (email/phút)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="send-rate"
                type="number"
                value={sendRate}
                onChange={(e) => setSendRate(parseInt(e.target.value) || 50)}
                min={1}
                max={100}
                data-testid="input-send-rate"
              />
              <span className="text-sm text-muted-foreground">email/phút</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Người nhận</p>
                <p className="text-2xl font-bold" data-testid="text-recipient-count">{parsedRecipients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thời gian dự kiến</p>
                <p className="text-2xl font-bold">
                  {Math.ceil(parsedRecipients.length / sendRate)} phút
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hoàn thành lúc{" "}
                  {(() => {
                    const minutes = Math.ceil(parsedRecipients.length / sendRate);
                    const completionTime = new Date(Date.now() + minutes * 60000);
                    return completionTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tốc độ gửi</p>
                <p className="text-2xl font-bold">{sendRate}/phút</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt chiến dịch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Tiêu đề thư:</span>
            <span className="text-sm font-medium">{emailSubject}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Mẫu:</span>
            <span className="text-sm font-medium">
              {selectedTemplate?.name || "Không có"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Tổng số người nhận:</span>
            <span className="text-sm font-medium">{parsedRecipients.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/bulk-campaigns")}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Tạo chiến dịch báo giá hàng loạt</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}

          <Separator className="my-6" />

          <div className="min-h-96">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <Separator className="my-6" />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-previous-step"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} data-testid="button-next-step">
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createCampaignMutation.isPending}
                data-testid="button-send-campaign"
              >
                <Send className="w-4 h-4 mr-2" />
                {createCampaignMutation.isPending ? "Đang gửi..." : "Gửi chiến dịch"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
