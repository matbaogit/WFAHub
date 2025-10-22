import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { VariablePicker } from "@/components/VariablePicker";
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
  Zap,
  Calendar as CalendarIcon,
  Coins,
  Loader2,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  availableVariables?: Array<{label: string, value: string}>;
}

export default function BulkCampaignWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emailSubjectRef = useRef<HTMLInputElement>(null);
  const emailBodyRef = useRef<HTMLTextAreaElement>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [campaignName, setCampaignName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [availableVariables, setAvailableVariables] = useState<Array<{label: string, value: string}>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [quotationHtmlContent, setQuotationHtmlContent] = useState("");
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendRate, setSendRate] = useState(50);
  const [showMappingView, setShowMappingView] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [showCreditDialog, setShowCreditDialog] = useState(false);

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
        autoMapping: data.autoMapping || {},
        availableVariables: data.availableVariables || []
      });
      setColumnMapping(data.autoMapping || {});
      setAvailableVariables(data.availableVariables || []);
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
      // Update availableVariables from apply-mapping response
      if (data.availableVariables) {
        setAvailableVariables(data.availableVariables);
      }
      toast({
        title: "Áp dụng mapping thành công",
        description: `Đã phân tích ${data.totalCount} người nhận với ${data.availableVariables?.length || 0} biến`,
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

      if (schedulingMode === "now") {
        await apiRequest("POST", `/api/bulk-campaigns/${campaign.id}/send`, {});
      }

      return campaign;
    },
    onSuccess: async () => {
      setShowCreditDialog(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      const message = schedulingMode === "now" 
        ? "Chiến dịch email hàng loạt đã bắt đầu gửi."
        : "Chiến dịch đã được lên lịch thành công.";

      toast({
        title: "Chiến dịch đã tạo!",
        description: message,
      });

      navigate("/bulk-campaigns");
    },
    onError: () => {
      setShowCreditDialog(false);
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
        description: "Vui lòng chọn mẫu tệp cá nhân hoá.",
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

    if (schedulingMode === "scheduled" && (!scheduledDate || !scheduledTime)) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin lên lịch",
        description: "Vui lòng chọn ngày và giờ gửi.",
      });
      return;
    }

    setShowCreditDialog(true);
  };

  const handleCreateCampaign = () => {
    let scheduledAt = null;
    if (schedulingMode === "scheduled" && scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduled = new Date(scheduledDate);
      scheduled.setHours(hours, minutes, 0, 0);
      scheduledAt = scheduled.toISOString();
    }

    createCampaignMutation.mutate({
      name: campaignName,
      emailSubject,
      emailBody,
      quotationHtml: quotationHtmlContent || null,
      quotationTemplateId: selectedTemplateId || null,
      sendRate,
      scheduledAt,
      userId: user?.id,
      availableVariables,
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

        {parsedRecipients.length > 0 && (() => {
          // Get all unique customData keys from all recipients
          const customDataKeys = Array.from(
            new Set(
              parsedRecipients.flatMap(r => 
                r.customData ? Object.keys(r.customData) : []
              )
            )
          );

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Đã phân tích thành công ({parsedRecipients.length} người nhận)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        {parsedRecipients.some(r => r.name) && (
                          <TableHead>Tên</TableHead>
                        )}
                        {customDataKeys.map(key => (
                          <TableHead key={key} className="capitalize">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRecipients.slice(0, 10).map((recipient, idx) => (
                        <TableRow key={idx} data-testid={`row-recipient-${idx}`}>
                          <TableCell>{recipient.email}</TableCell>
                          {parsedRecipients.some(r => r.name) && (
                            <TableCell>{recipient.name || "-"}</TableCell>
                          )}
                          {customDataKeys.map(key => (
                            <TableCell key={key}>
                              {recipient.customData?.[key] || "-"}
                            </TableCell>
                          ))}
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
          );
        })()}
      </div>
    );
  };

  const renderStep2 = () => {
    const handleQuotationDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const variable = e.dataTransfer.getData("text/plain");
      
      if (!quotationTextareaRef.current) return;
      
      const textarea = quotationTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = quotationHtmlContent;
      
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setQuotationHtmlContent(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    };

    const handleQuotationDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    const handleTemplateSelect = (templateId: string) => {
      setSelectedTemplateId(templateId);
      const template = quotationTemplates.find(t => t.id === templateId);
      if (template) {
        setQuotationHtmlContent(template.htmlContent);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Chọn mẫu tệp cá nhân hoá</h2>
          <p className="text-sm text-muted-foreground">
            Chọn mẫu hoặc soạn HTML tùy chỉnh. Kéo thả biến từ sidebar vào khung soạn thảo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <VariablePicker 
              variables={availableVariables} 
              title="Biến từ CSV"
              description="Kéo và thả vào khung HTML"
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Mẫu tệp cá nhân hoá (tùy chọn)</Label>
                  <Select
                    value={selectedTemplateId || ""}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger id="template-select" data-testid="select-quotation-template">
                      <SelectValue placeholder="-- Chọn mẫu để tự động điền --" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotation-html">Nội dung HTML</Label>
                  <Textarea
                    ref={quotationTextareaRef}
                    id="quotation-html"
                    value={quotationHtmlContent}
                    onChange={(e) => setQuotationHtmlContent(e.target.value)}
                    onDrop={handleQuotationDrop}
                    onDragOver={handleQuotationDragOver}
                    placeholder="<div>Nội dung cho {name}...</div>"
                    className="font-mono text-sm min-h-[300px] bg-muted/30"
                    data-testid="textarea-quotation-html"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar hoặc nhập trực tiếp mã HTML
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const handleEmailSubjectDrop = (e: React.DragEvent<HTMLInputElement>) => {
      e.preventDefault();
      const variable = e.dataTransfer.getData("text/plain");
      
      if (!emailSubjectRef.current) return;
      
      const input = emailSubjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = emailSubject;
      
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setEmailSubject(newValue);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    };

    const handleEmailBodyDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const variable = e.dataTransfer.getData("text/plain");
      
      if (!emailBodyRef.current) return;
      
      const textarea = emailBodyRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = emailBody;
      
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setEmailBody(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Soạn thư</h2>
          <p className="text-sm text-muted-foreground">
            Soạn email hoặc chọn mẫu. Kéo thả biến từ sidebar vào tiêu đề hoặc nội dung.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <VariablePicker 
              variables={availableVariables} 
              title="Biến từ CSV"
              description="Kéo và thả vào email"
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-template-select">Mẫu email (tùy chọn)</Label>
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
                      <SelectValue placeholder="-- Chọn mẫu để tự động điền --" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Tiêu đề thư</Label>
                  <Input
                    ref={emailSubjectRef}
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    onDrop={handleEmailSubjectDrop}
                    onDragOver={handleDragOver}
                    placeholder="Email dành riêng cho {name}"
                    className="bg-muted/30"
                    data-testid="input-email-subject"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar vào tiêu đề
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Nội dung thư</Label>
                  <Textarea
                    ref={emailBodyRef}
                    id="email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    onDrop={handleEmailBodyDrop}
                    onDragOver={handleDragOver}
                    placeholder="Xin chào {name},&#10;&#10;Chúng tôi gửi đến bạn thông tin chi tiết...&#10;&#10;Trân trọng."
                    rows={12}
                    className="bg-muted/30"
                    data-testid="input-email-body"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar hoặc nhập trực tiếp nội dung
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
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const estimatedCreditCost = parsedRecipients.length * 1;
    
    const getScheduledStartTime = () => {
      if (schedulingMode === "now") {
        return new Date();
      }
      if (!scheduledDate || !scheduledTime) {
        return new Date();
      }
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduled = new Date(scheduledDate);
      scheduled.setHours(hours, minutes, 0, 0);
      return scheduled;
    };

    const getCompletionTime = () => {
      const startTime = getScheduledStartTime();
      const minutes = Math.ceil(parsedRecipients.length / sendRate);
      return new Date(startTime.getTime() + minutes * 60000);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Xem lại & Gửi</h2>
          <p className="text-sm text-muted-foreground">
            Xem lại cài đặt chiến dịch, lên lịch và xác nhận gửi
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Lên lịch gửi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={schedulingMode}
              onValueChange={(value) => setSchedulingMode(value as "now" | "scheduled")}
              data-testid="radio-scheduling-mode"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="scheduling-now" data-testid="radio-send-now" />
                <Label htmlFor="scheduling-now" className="cursor-pointer">Gửi ngay</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduling-later" data-testid="radio-send-scheduled" />
                <Label htmlFor="scheduling-later" className="cursor-pointer">Lên lịch gửi sau</Label>
              </div>
            </RadioGroup>

            {schedulingMode === "scheduled" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Ngày gửi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-muted/30"
                        data-testid="button-select-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">Giờ gửi (GMT+7)</Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-muted/30"
                    data-testid="input-scheduled-time"
                  />
                </div>
              </div>
            )}
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
                    {getCompletionTime().toLocaleString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chi phí tín dụng</p>
                  <p className="text-2xl font-bold" data-testid="text-estimated-credits">
                    {estimatedCreditCost.toLocaleString('vi-VN')}
                  </p>
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
              <span className="text-sm text-muted-foreground">Mẫu tệp đính kèm:</span>
              <span className="text-sm font-medium">
                {selectedTemplate?.name || "Không có"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Tổng số người nhận:</span>
              <span className="text-sm font-medium">{parsedRecipients.length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Thời gian gửi:</span>
              <span className="text-sm font-medium">
                {schedulingMode === "now" ? "Ngay lập tức" : 
                  scheduledDate && scheduledTime ? 
                    `${format(scheduledDate, "dd/MM/yyyy")} lúc ${scheduledTime}` : 
                    "Chưa chọn"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
          <DialogContent data-testid="dialog-credit-confirmation">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Xác nhận sử dụng tín dụng
              </DialogTitle>
              <DialogDescription>
                Vui lòng xác nhận thông tin trước khi gửi chiến dịch
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm text-muted-foreground">Số dư tín dụng hiện tại:</span>
                <span className="text-lg font-bold" data-testid="text-current-balance">
                  {user?.credits?.toLocaleString('vi-VN') || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm text-muted-foreground">Chi phí chiến dịch:</span>
                <span className="text-lg font-bold text-destructive" data-testid="text-campaign-cost">
                  -{estimatedCreditCost.toLocaleString('vi-VN')}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md">
                <span className="text-sm font-medium">Số dư sau khi gửi:</span>
                <span className="text-xl font-bold text-primary" data-testid="text-balance-after">
                  {((user?.credits || 0) - estimatedCreditCost).toLocaleString('vi-VN')}
                </span>
              </div>

              {(user?.credits || 0) < estimatedCreditCost && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Số dư tín dụng không đủ! Vui lòng nạp thêm tín dụng để tiếp tục.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreditDialog(false)}
                data-testid="button-cancel-send"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending || (user?.credits || 0) < estimatedCreditCost}
                data-testid="button-confirm-send"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Xác nhận gửi
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

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
          <CardTitle className="text-3xl">Tạo chiến dịch gửi email hàng loạt</CardTitle>
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
