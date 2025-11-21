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
import DynamicFieldMapping, { type FieldMapping } from "@/components/DynamicFieldMapping";
import { VariablePicker } from "@/components/VariablePicker";
import { TiptapEditor } from "@/components/TiptapEditor";
import PreviewPane from "@/components/PreviewPane";
import { SmtpConfigDialog } from "@/components/SmtpConfigDialog";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow as TiptapTableRow } from '@tiptap/extension-table-row';
import { TableCell as TiptapTableCell } from '@tiptap/extension-table-cell';
import { TableHeader as TiptapTableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { FloatingImage } from '@/extensions/FloatingImage';
import './tiptap-editor.css';
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
  Eye,
  Server,
  Settings,
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
import { Checkbox } from "@/components/ui/checkbox";
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
  const emailSubjectRef = useRef<HTMLInputElement>(null);
  const emailBodyRef = useRef<HTMLTextAreaElement>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [campaignName, setCampaignName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { fieldName: 'email', columnName: '' }
  ]);
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [availableVariables, setAvailableVariables] = useState<Array<{label: string, value: string}>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [quotationHtmlContent, setQuotationHtmlContent] = useState("");
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendRate, setSendRate] = useState(50);
  const [showMappingView, setShowMappingView] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<"now" | "scheduled" | "csv">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [csvDateField, setCsvDateField] = useState("");
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [activeField, setActiveField] = useState<'subject' | 'body' | null>(null);
  const activeFieldRef = useRef<'subject' | 'body' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSmtpDialogOpen, setIsSmtpDialogOpen] = useState(false);
  const [step2Mode, setStep2Mode] = useState<null | 'template' | 'custom'>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

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

  // Editor for quotation template (Step 2)
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapTable.configure({
        resizable: true,
      }),
      TiptapTableRow,
      TiptapTableHeader,
      TiptapTableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      FloatingImage,
      TextStyle,
      Color,
      Dropcursor.configure({
        color: 'hsl(var(--primary))',
        width: 3,
      }),
    ],
    content: quotationHtmlContent,
    onUpdate: ({ editor }) => {
      setQuotationHtmlContent(editor.getHTML());
    },
    editorProps: {
      transformPastedHTML(html) {
        // Parse Word HTML and convert float styles to classes
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        doc.querySelectorAll('img').forEach(img => {
          const style = img.getAttribute('style') || '';
          
          // Detect Word float patterns
          if (style.includes('float:left') || style.includes('float: left')) {
            img.classList.add('float-left');
          } else if (style.includes('float:right') || style.includes('float: right')) {
            img.classList.add('float-right');
          }
          
          // Preserve width/height from style or attributes
          const width = img.style.width || img.getAttribute('width');
          const height = img.style.height || img.getAttribute('height');
          if (width) img.setAttribute('width', width);
          if (height) img.setAttribute('height', height);
        });
        
        return doc.body.innerHTML;
      },
    },
  });

  // Editor for email body (Step 3)
  const emailEditor = useEditor({
    extensions: [
      StarterKit,
      TiptapTable.configure({
        resizable: true,
      }),
      TiptapTableRow,
      TiptapTableHeader,
      TiptapTableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      FloatingImage,
      TextStyle,
      Color,
      Dropcursor.configure({
        color: 'hsl(var(--primary))',
        width: 3,
      }),
    ],
    content: emailBody,
    onUpdate: ({ editor }) => {
      setEmailBody(editor.getHTML());
    },
    editorProps: {
      transformPastedHTML(html) {
        // Parse Word HTML and convert float styles to classes
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        doc.querySelectorAll('img').forEach(img => {
          const style = img.getAttribute('style') || '';
          
          // Detect Word float patterns
          if (style.includes('float:left') || style.includes('float: left')) {
            img.classList.add('float-left');
          } else if (style.includes('float:right') || style.includes('float: right')) {
            img.classList.add('float-right');
          }
          
          // Preserve width/height from style or attributes
          const width = img.style.width || img.getAttribute('width');
          const height = img.style.height || img.getAttribute('height');
          if (width) img.setAttribute('width', width);
          if (height) img.setAttribute('height', height);
        });
        
        return doc.body.innerHTML;
      },
    },
  });

  // Add clipboard paste handler for quotation editor (Step 2)
  if (editor) {
    editor.options.editorProps = {
      ...editor.options.editorProps,
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        
        // Case 1: Check for direct image files (screenshots, copy from file explorer)
        const hasDirectImageFile = items.some(item => item.type.indexOf("image") === 0);
        if (hasDirectImageFile) {
          event.preventDefault();
          for (const item of items) {
            if (item.type.indexOf("image") === 0) {
              const file = item.getAsFile();
              if (!file) continue;
              
              // Upload image to server
              const formData = new FormData();
              formData.append('file', file);
              fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'include',
              })
                .then(response => {
                  if (!response.ok) throw new Error('Upload failed');
                  return response.json();
                })
                .then(json => {
                  // Use TipTap command to insert image safely
                  if (editor && !editor.isDestroyed) {
                    editor.chain().focus().setImage({ src: json.location }).run();
                  }
                })
                .catch(error => {
                  console.error('Image upload failed:', error);
                  toast({
                    variant: "destructive",
                    title: "Upload ảnh thất bại",
                    description: "Không thể tải ảnh lên server.",
                  });
                });
            }
          }
          return true; // Handled - prevent default paste behavior
        }
        
        // Case 2: Check for base64 images in HTML (from Word documents)
        const html = event.clipboardData?.getData('text/html');
        if (html && html.includes('<img')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const images = doc.querySelectorAll('img');
          
          const base64Images: Array<{ img: HTMLImageElement; src: string }> = [];
          images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && src.startsWith('data:image')) {
              base64Images.push({ img: img as HTMLImageElement, src });
            }
          });
          
          if (base64Images.length > 0) {
            event.preventDefault();
            
            // Upload all base64 images in parallel
            const uploadPromises = base64Images.map(({ img, src }) => {
              return fetch(src)
                .then(res => res.blob())
                .then(blob => {
                  const formData = new FormData();
                  formData.append('file', blob, 'pasted-image.png');
                  return fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                  });
                })
                .then(response => {
                  if (!response.ok) throw new Error('Upload failed');
                  return response.json();
                })
                .then(json => ({ img, newUrl: json.location }))
                .catch(error => {
                  console.error('Image upload failed:', error);
                  return { img, newUrl: null };
                });
            });
            
            // Wait for all uploads, then insert HTML with replaced URLs and float classes
            Promise.all(uploadPromises)
              .then(results => {
                // Replace base64 src with uploaded URLs and add float classes
                results.forEach(({ img, newUrl }) => {
                  if (newUrl) {
                    img.setAttribute('src', newUrl);
                  }
                  
                  // Detect Word float patterns and add classes
                  const style = img.getAttribute('style') || '';
                  if (style.includes('float:left') || style.includes('float: left')) {
                    img.classList.add('float-left');
                  } else if (style.includes('float:right') || style.includes('float: right')) {
                    img.classList.add('float-right');
                  }
                  
                  // Preserve width/height
                  const width = img.style.width || img.getAttribute('width');
                  const height = img.style.height || img.getAttribute('height');
                  if (width) img.setAttribute('width', width);
                  if (height) img.setAttribute('height', height);
                });
                
                // Get the modified HTML and insert into editor
                const modifiedHtml = doc.body.innerHTML;
                if (editor && !editor.isDestroyed) {
                  editor.chain().focus().insertContent(modifiedHtml).run();
                }
              })
              .catch(error => {
                console.error('Failed to process images:', error);
                toast({
                  variant: "destructive",
                  title: "Upload ảnh thất bại",
                  description: "Không thể tải ảnh từ Word lên server.",
                });
              });
            
            return true; // Handled - prevent default paste behavior
          }
        }
        
        return false; // Not handled - use default paste behavior
      },
    };
  }

  // Add clipboard paste handler for email editor (Step 3)
  if (emailEditor) {
    emailEditor.options.editorProps = {
      ...emailEditor.options.editorProps,
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        
        // Case 1: Check for direct image files (screenshots, copy from file explorer)
        const hasDirectImageFile = items.some(item => item.type.indexOf("image") === 0);
        if (hasDirectImageFile) {
          event.preventDefault();
          for (const item of items) {
            if (item.type.indexOf("image") === 0) {
              const file = item.getAsFile();
              if (!file) continue;
              
              // Upload image to server
              const formData = new FormData();
              formData.append('file', file);
              fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'include',
              })
                .then(response => {
                  if (!response.ok) throw new Error('Upload failed');
                  return response.json();
                })
                .then(json => {
                  // Use TipTap command to insert image safely
                  if (emailEditor && !emailEditor.isDestroyed) {
                    emailEditor.chain().focus().setImage({ src: json.location }).run();
                  }
                })
                .catch(error => {
                  console.error('Image upload failed:', error);
                  toast({
                    variant: "destructive",
                    title: "Upload ảnh thất bại",
                    description: "Không thể tải ảnh lên server.",
                  });
                });
            }
          }
          return true; // Handled - prevent default paste behavior
        }
        
        // Case 2: Check for base64 images in HTML (from Word documents)
        const html = event.clipboardData?.getData('text/html');
        if (html && html.includes('<img')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const images = doc.querySelectorAll('img');
          
          const base64Images: Array<{ img: HTMLImageElement; src: string }> = [];
          images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && src.startsWith('data:image')) {
              base64Images.push({ img: img as HTMLImageElement, src });
            }
          });
          
          if (base64Images.length > 0) {
            event.preventDefault();
            
            // Upload all base64 images in parallel
            const uploadPromises = base64Images.map(({ img, src }) => {
              return fetch(src)
                .then(res => res.blob())
                .then(blob => {
                  const formData = new FormData();
                  formData.append('file', blob, 'pasted-image.png');
                  return fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                  });
                })
                .then(response => {
                  if (!response.ok) throw new Error('Upload failed');
                  return response.json();
                })
                .then(json => ({ img, newUrl: json.location }))
                .catch(error => {
                  console.error('Image upload failed:', error);
                  return { img, newUrl: null };
                });
            });
            
            // Wait for all uploads, then insert HTML with replaced URLs and float classes
            Promise.all(uploadPromises)
              .then(results => {
                // Replace base64 src with uploaded URLs and add float classes
                results.forEach(({ img, newUrl }) => {
                  if (newUrl) {
                    img.setAttribute('src', newUrl);
                  }
                  
                  // Detect Word float patterns and add classes
                  const style = img.getAttribute('style') || '';
                  if (style.includes('float:left') || style.includes('float: left')) {
                    img.classList.add('float-left');
                  } else if (style.includes('float:right') || style.includes('float: right')) {
                    img.classList.add('float-right');
                  }
                  
                  // Preserve width/height
                  const width = img.style.width || img.getAttribute('width');
                  const height = img.style.height || img.getAttribute('height');
                  if (width) img.setAttribute('width', width);
                  if (height) img.setAttribute('height', height);
                });
                
                // Get the modified HTML and insert into editor
                const modifiedHtml = doc.body.innerHTML;
                if (emailEditor && !emailEditor.isDestroyed) {
                  emailEditor.chain().focus().insertContent(modifiedHtml).run();
                }
              })
              .catch(error => {
                console.error('Failed to process images:', error);
                toast({
                  variant: "destructive",
                  title: "Upload ảnh thất bại",
                  description: "Không thể tải ảnh từ Word lên server.",
                });
              });
            
            return true; // Handled - prevent default paste behavior
          }
        }
        
        return false; // Not handled - use default paste behavior
      },
    };
  }

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
      
      // Auto-create mappings for ALL columns in the file
      // Email is always first (required), other columns follow
      const emailColumn = data.autoMapping?.email || '';
      const newMappings: FieldMapping[] = [
        { fieldName: 'email', columnName: emailColumn }
      ];
      
      // Add all other columns (auto-map fieldName = columnName)
      data.headers.forEach((header: string) => {
        // Skip if it's already mapped to email
        if (header.toLowerCase() !== 'email' && header !== emailColumn) {
          newMappings.push({
            fieldName: header,  // fieldName = columnName
            columnName: header
          });
        }
      });
      
      setFieldMappings(newMappings);
      
      setAvailableVariables(data.availableVariables || []);
      setShowMappingView(true);
      toast({
        title: "Tải file thành công",
        description: `Tìm thấy ${data.totalRows} dòng dữ liệu với ${data.headers.length} cột`,
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
      
      // Convert fieldMappings array to Record<string, string> format for backend
      const columnMapping: Record<string, string> = {};
      fieldMappings.forEach(mapping => {
        if (mapping.fieldName && mapping.columnName) {
          columnMapping[mapping.fieldName] = mapping.columnName;
        }
      });
      
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

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      return apiRequest("POST", "/api/quotation-templates", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
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

  const handleNext = async () => {
    if (currentStep === 1 && parsedRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Chưa có người nhận",
        description: "Vui lòng tải lên file danh sách người nhận.",
      });
      return;
    }

    // Step 2: Save template if checkbox is checked
    if (currentStep === 2 && saveAsTemplate && step2Mode !== null) {
      if (!campaignName.trim()) {
        toast({
          variant: "destructive",
          title: "Thiếu tên chiến dịch",
          description: "Vui lòng nhập tên chiến dịch để lưu mẫu.",
        });
        return;
      }

      try {
        await saveTemplateMutation.mutateAsync({
          name: `${campaignName} - Mẫu tệp đính kèm`,
          content: quotationHtmlContent,
        });
        
        toast({
          title: "Đã lưu mẫu!",
          description: "Mẫu tệp đính kèm đã được lưu thành công.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lưu mẫu thất bại",
          description: "Vui lòng thử lại.",
        });
        return;
      }
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
      schedulingMode,
      csvDateField: schedulingMode === "csv" ? csvDateField : null,
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
              {step === 1 && "Nhập dữ liệu"}
              {step === 2 && "Mẫu tệp đính kèm"}
              {step === 3 && "Nội dung email"}
              {step === 4 && "Xem lại và gửi"}
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
      // Check if email field has a column selected
      const emailMapping = fieldMappings.find(m => m.fieldName.toLowerCase() === 'email');
      
      if (!emailMapping || !emailMapping.columnName) {
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
                <CardTitle>Liên kết cột dữ liệu</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowMappingView(false);
                    setFilePreview(null);
                    setUploadedFile(null);
                    setParsedRecipients([]);
                    setFieldMappings([{ fieldName: 'email', columnName: '' }]);
                  }}
                  data-testid="button-change-file"
                >
                  Đổi file
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const emailMapping = fieldMappings.find(m => m.fieldName.toLowerCase() === 'email');
                return !emailMapping?.columnName && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Vui lòng chọn cột Email (bắt buộc)
                    </AlertDescription>
                  </Alert>
                );
              })()}
              
              <DynamicFieldMapping
                headers={filePreview?.headers || []}
                preview={filePreview?.preview || []}
                mappings={fieldMappings}
                onMappingsChange={setFieldMappings}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleApplyMapping}
                  disabled={
                    !fieldMappings.find(m => m.fieldName.toLowerCase() === 'email')?.columnName ||
                    applyMappingMutation.isPending
                  }
                  data-testid="button-apply-mapping"
                >
                  {applyMappingMutation.isPending ? "Đang xử lý..." : "Áp dụng"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {parsedRecipients.length > 0 && (() => {
          // Helper function to normalize column names (must match backend normalizeVariableName)
          const normalizeVariableName = (columnName: string): string => {
            return columnName
              .toLowerCase()
              .trim()
              .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
              .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
              .replace(/[ìíịỉĩ]/g, 'i')
              .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
              .replace(/[ùúụủũưừứựửữ]/g, 'u')
              .replace(/[ỳýỵỷỹ]/g, 'y')
              .replace(/đ/g, 'd')
              .replace(/[^a-z0-9]/g, '_');
          };

          // Get field mappings with normalized column names for lookup
          const displayFields = fieldMappings
            .filter(m => m.fieldName.toLowerCase() !== 'email' && m.columnName)
            .map(m => ({
              fieldName: m.fieldName,
              normalizedColumnName: normalizeVariableName(m.columnName)
            }));

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
                        {displayFields.map(field => (
                          <TableHead key={field.fieldName} className="capitalize">
                            {field.fieldName}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRecipients.slice(0, 10).map((recipient, idx) => (
                        <TableRow key={idx} data-testid={`row-recipient-${idx}`}>
                          <TableCell>{recipient.email}</TableCell>
                          {displayFields.map(field => (
                            <TableCell key={field.fieldName}>
                              {recipient.customData?.[field.normalizedColumnName] || "-"}
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
    const handleTemplateSelect = (templateId: string) => {
      setSelectedTemplateId(templateId);
      const template = quotationTemplates.find(t => t.id === templateId);
      if (template && template.htmlContent) {
        setQuotationHtmlContent(template.htmlContent);
        // Update editor content immediately
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(template.htmlContent);
        }
      }
    };

    // Extract sample data from first recipient for preview
    const sampleData: Record<string, string> = {};
    if (parsedRecipients.length > 0) {
      const firstRecipient = parsedRecipients[0];
      sampleData.email = firstRecipient.email;
      if (firstRecipient.name) {
        sampleData.name = firstRecipient.name;
      }
      if (firstRecipient.customData) {
        Object.assign(sampleData, firstRecipient.customData);
      }
    }

    // Initial mode selection screen
    if (step2Mode === null) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Chọn mẫu tệp đính kèm</h2>
            <p className="text-sm text-muted-foreground">
              Chọn mẫu đính kèm hoặc soạn nội dung tuỳ chỉnh. Kéo thả biến từ thanh bên trái vào khung soạn thảo hoặc dán từ Word. 
              Nếu không cần đính kèm tệp thì bấm{" "}
              <button 
                onClick={handleNext}
                className="text-primary hover:underline font-medium"
                data-testid="link-skip-attachment"
              >
                vào đây
              </button>
              {" "}để qua bước soạn nội dung thư.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep2Mode('template')}
                  className="h-auto py-6 justify-start"
                  data-testid="button-choose-template-mode"
                >
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span className="font-semibold">Chọn mẫu đính kèm</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Chọn từ thư viện mẫu có sẵn và tùy chỉnh nội dung
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep2Mode('custom')}
                  className="h-auto py-6 justify-start"
                  data-testid="button-choose-custom-mode"
                >
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span className="font-semibold">Soạn nội dung</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Tự soạn nội dung từ đầu với editor
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Template mode or Custom mode
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep2Mode(null)}
              data-testid="button-back-to-mode-selection"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">
                {step2Mode === 'template' ? 'Chọn mẫu đính kèm' : 'Soạn nội dung tùy chỉnh'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Kéo thả biến từ thanh bên trái vào khung soạn thảo hoặc dán từ Word
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex items-center gap-2"
            data-testid="button-toggle-preview"
          >
            <Eye className="w-4 h-4" />
            {isPreviewOpen ? "Ẩn xem trước" : "Hiện xem trước"}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Variables */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <VariablePicker 
              variables={availableVariables} 
              title="Biến từ CSV"
              description="Kéo và thả hoặc nhấp đôi để chèn"
              sampleData={sampleData}
              editor={editor}
            />
          </div>

          {/* Main Editor - Full Width */}
          <div className="flex-1 min-w-0 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Show template selector only in template mode */}
                {step2Mode === 'template' && (
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Mẫu tệp đính kèm (tùy chọn)</Label>
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="quotation-html">Nội dung HTML</Label>
                  <TiptapEditor
                    editor={editor}
                    onImageUpload={async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      });
                      if (!response.ok) throw new Error('Upload failed');
                      const json = await response.json();
                      return json.location;
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar vào editor hoặc paste nội dung từ Word với định dạng bảng và hình ảnh
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Preview Panel */}
        {isPreviewOpen && (
          <div className="fixed right-8 top-32 w-96 max-h-[calc(100vh-12rem)] z-50 hidden lg:block">
            <PreviewPane 
              htmlContent={quotationHtmlContent}
              sampleData={sampleData}
              title="Xem trước tệp đính kèm"
            />
          </div>
        )}
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

    // Handle double-click on variable to insert into active field
    const handleVariableDoubleClick = (variableValue: string) => {
      // Use ref instead of state to avoid race condition with onBlur
      const currentActiveField = activeFieldRef.current;
      
      if (currentActiveField === 'subject' && emailSubjectRef.current) {
        const input = emailSubjectRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = emailSubject;
        
        const newValue = currentValue.substring(0, start) + variableValue + currentValue.substring(end);
        setEmailSubject(newValue);
        
        // Flash effect
        input.style.transition = 'background-color 0.3s ease';
        input.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
        setTimeout(() => {
          input.style.backgroundColor = '';
        }, 300);
        
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + variableValue.length, start + variableValue.length);
        }, 0);
      } else if (currentActiveField === 'body' && emailBodyRef.current) {
        const textarea = emailBodyRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = emailBody;
        
        const newValue = currentValue.substring(0, start) + variableValue + currentValue.substring(end);
        setEmailBody(newValue);
        
        // Flash effect
        textarea.style.transition = 'background-color 0.3s ease';
        textarea.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
        setTimeout(() => {
          textarea.style.backgroundColor = '';
        }, 300);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + variableValue.length, start + variableValue.length);
        }, 0);
      }
    };

    // Extract sample data from first recipient for preview
    const sampleData: Record<string, string> = {};
    if (parsedRecipients.length > 0) {
      const firstRecipient = parsedRecipients[0];
      sampleData.email = firstRecipient.email;
      if (firstRecipient.name) {
        sampleData.name = firstRecipient.name;
      }
      if (firstRecipient.customData) {
        Object.assign(sampleData, firstRecipient.customData);
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2" data-testid="text-step-title">Soạn thư</h2>
            <p className="text-sm text-muted-foreground">
              Soạn email hoặc chọn mẫu. Kéo thả biến từ sidebar vào tiêu đề hoặc nội dung.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex items-center gap-2"
            data-testid="button-toggle-preview"
          >
            <Eye className="w-4 h-4" />
            {isPreviewOpen ? "Ẩn xem trước" : "Hiện xem trước"}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Variables */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <VariablePicker 
              variables={availableVariables} 
              title="Biến từ CSV"
              description="Kéo và thả hoặc nhấp đôi để chèn"
              sampleData={sampleData}
              editor={emailEditor}
            />
          </div>

          {/* Main Editor - Full Width */}
          <div className="flex-1 min-w-0 space-y-4">
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
                        // Update email editor content
                        if (emailEditor && !emailEditor.isDestroyed) {
                          emailEditor.commands.setContent(template.htmlContent);
                        }
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
                    onFocus={() => {
                      setActiveField('subject');
                      activeFieldRef.current = 'subject';
                    }}
                    onBlur={() => {
                      // Delay clearing to allow double-click handler to complete
                      setTimeout(() => {
                        setActiveField(null);
                        activeFieldRef.current = null;
                      }, 200);
                    }}
                    onDrop={handleEmailSubjectDrop}
                    onDragOver={handleDragOver}
                    placeholder="Email dành riêng cho {name}"
                    className="bg-muted/30"
                    data-testid="input-email-subject"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar hoặc nhấp đôi khi trường này đang focus
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Nội dung thư</Label>
                  <TiptapEditor
                    editor={emailEditor}
                    onImageUpload={async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      });
                      if (!response.ok) throw new Error('Upload failed');
                      const json = await response.json();
                      return json.location;
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kéo thả biến từ sidebar vào editor hoặc paste nội dung từ Word với định dạng bảng và hình ảnh
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Preview Panel */}
        {isPreviewOpen && (
          <div className="fixed right-8 top-32 w-96 max-h-[calc(100vh-12rem)] z-50 hidden lg:block">
            <PreviewPane 
              htmlContent={emailBody}
              sampleData={sampleData}
              title="Xem trước email"
              subject={emailSubject}
            />
          </div>
        )}
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
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" data-testid="alert-smtp-not-configured">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Server className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">Chưa cấu hình SMTP</h4>
                </div>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Bạn cần cấu hình máy chủ email (SMTP) để có thể gửi chiến dịch báo giá. 
                  Hệ thống hỗ trợ Gmail, Outlook và các SMTP server khác.
                </AlertDescription>
                <Button 
                  onClick={() => setIsSmtpDialogOpen(true)}
                  className="mt-2"
                  size="sm"
                  data-testid="button-open-smtp-config"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Cấu hình SMTP ngay
                </Button>
              </div>
            </div>
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
              onValueChange={(value) => setSchedulingMode(value as "now" | "scheduled" | "csv")}
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="scheduling-csv" data-testid="radio-send-csv" />
                <Label htmlFor="scheduling-csv" className="cursor-pointer">Lịch theo file CSV</Label>
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

            {schedulingMode === "csv" && (
              <div className="pl-6 border-l-2 border-primary/20 space-y-2">
                <Label htmlFor="csv-date-field">Chọn cột chứa ngày gửi</Label>
                <Select value={csvDateField} onValueChange={setCsvDateField}>
                  <SelectTrigger id="csv-date-field" className="bg-muted/30" data-testid="select-csv-date-field">
                    <SelectValue placeholder="-- Chọn cột ngày --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVariables.map((variable, index) => (
                      <SelectItem key={index} value={variable.value}>
                        {variable.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hệ thống sẽ lấy ngày từ cột này để gửi email tự động cho từng người nhận.
                  Định dạng hỗ trợ: DD/MM/YYYY, YYYY-MM-DD, hoặc ISO 8601.
                </p>
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

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-previous-step"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <div className="flex items-center gap-4">
              {currentStep === 2 && step2Mode !== null && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-as-template"
                    checked={saveAsTemplate}
                    onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
                    data-testid="checkbox-save-as-template"
                  />
                  <Label 
                    htmlFor="save-as-template" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Lưu mẫu
                  </Label>
                </div>
              )}

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
          </div>
        </CardContent>
      </Card>

      <SmtpConfigDialog 
        open={isSmtpDialogOpen} 
        onOpenChange={setIsSmtpDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/smtp-config"] });
        }}
      />
    </div>
  );
}
