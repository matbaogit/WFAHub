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

export default function BulkCampaignWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [campaignName, setCampaignName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendRate, setSendRate] = useState(50);

  const { data: quotationTemplates = [] } = useQuery<QuotationTemplate[]>({
    queryKey: ["/api/quotation-templates"],
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
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      setParsedRecipients(data.recipients || []);
      toast({
        title: "File uploaded successfully",
        description: `Found ${data.recipients?.length || 0} recipients`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to parse the file. Please check the format.",
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
        title: "Campaign created!",
        description: "Your bulk email campaign has been started.",
      });

      navigate("/bulk-campaigns");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create campaign",
        description: "Please try again.",
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
        title: "No recipients",
        description: "Please upload a file with recipients first.",
      });
      return;
    }

    if (currentStep === 2 && !selectedTemplateId) {
      toast({
        variant: "destructive",
        title: "No template selected",
        description: "Please select a quotation template.",
      });
      return;
    }

    if (currentStep === 3 && (!emailSubject || !emailBody)) {
      toast({
        variant: "destructive",
        title: "Incomplete email",
        description: "Please provide both subject and email body.",
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
        title: "Campaign name required",
        description: "Please provide a name for your campaign.",
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
              {step === 1 && "Import"}
              {step === 2 && "Template"}
              {step === 3 && "Email"}
              {step === 4 && "Review"}
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Import Recipients</h2>
        <p className="text-sm text-muted-foreground">
          Upload an Excel or CSV file with recipient information
        </p>
      </div>

      <Card className="border-dashed hover-elevate">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {uploadedFile
                ? `Selected: ${uploadedFile.name}`
                : "Click to upload Excel or CSV file"}
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
              {uploadMutation.isPending ? "Uploading..." : "Select File"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedRecipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Recipients ({parsedRecipients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Custom Data</TableHead>
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
                            {Object.keys(recipient.customData).length} fields
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
                  Showing first 10 of {parsedRecipients.length} recipients
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Select Quotation Template</h2>
        <p className="text-sm text-muted-foreground">
          Choose a template to generate personalized quotations for each recipient
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotationTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover-elevate ${
              selectedTemplateId === template.id ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedTemplateId(template.id)}
            data-testid={`card-template-${template.id}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                {selectedTemplateId === template.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardHeader>
            {template.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {quotationTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No quotation templates found. Create one first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-muted/30">
              <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent.substring(0, 500) + "..." }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Compose Email</h2>
        <p className="text-sm text-muted-foreground">
          Write your email subject and body. Use merge fields like {`{name}`}, {`{email}`}, {`{company}`}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">Email Subject</Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Báo giá dành riêng cho {name}"
              data-testid="input-email-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Email Body</Label>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Xin chào {name},&#10;&#10;Chúng tôi gửi đến bạn báo giá chi tiết...&#10;&#10;Trân trọng."
              rows={12}
              data-testid="input-email-body"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use merge fields from your Excel columns: {`{name}`}, {`{email}`}, {`{company}`}, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 border rounded-md bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="font-medium">{emailSubject || "No subject"}</p>
            </div>
            <div className="p-3 border rounded-md bg-muted/30 min-h-32">
              <p className="text-xs text-muted-foreground mb-1">Body:</p>
              <div className="whitespace-pre-wrap text-sm">{emailBody || "No content"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Review & Send</h2>
        <p className="text-sm text-muted-foreground">
          Review your campaign settings and send
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Holiday Promotion 2025"
              data-testid="input-campaign-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-rate">Send Rate (emails per minute)</Label>
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
              <span className="text-sm text-muted-foreground">emails/min</span>
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
                <p className="text-sm text-muted-foreground">Recipients</p>
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
                <p className="text-sm text-muted-foreground">Est. Time</p>
                <p className="text-2xl font-bold">
                  {Math.ceil(parsedRecipients.length / sendRate)} min
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
                <p className="text-sm text-muted-foreground">Send Rate</p>
                <p className="text-2xl font-bold">{sendRate}/min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Email Subject:</span>
            <span className="text-sm font-medium">{emailSubject}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Template:</span>
            <span className="text-sm font-medium">
              {selectedTemplate?.name || "None"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Total Recipients:</span>
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
          Back to Campaigns
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create Bulk Email Campaign</CardTitle>
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
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} data-testid="button-next-step">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createCampaignMutation.isPending}
                data-testid="button-send-campaign"
              >
                <Send className="w-4 h-4 mr-2" />
                {createCampaignMutation.isPending ? "Sending..." : "Send Campaign"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
