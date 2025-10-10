import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Template } from "@shared/schema";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ExecutionModalProps {
  template: Template;
  open: boolean;
  onClose: () => void;
}

export function ExecutionModal({ template, open, onClose }: ExecutionModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiRequest("POST", "/api/execute", {
        templateId: template.id,
        inputData: data,
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({});
        onClose();
      }, 2000);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Đang đăng nhập lại...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi thực thi",
        description: error.message || "Không thể thực thi tính năng. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const inputSchema = template.inputSchema as Record<string, any>;
  const fields = inputSchema.fields || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeMutation.mutate(formData);
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-in zoom-in">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thực thi thành công!</h3>
            <p className="text-muted-foreground text-center">
              Tính năng đã được thực thi và ghi nhận vào lịch sử
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.nameVi}</DialogTitle>
          <DialogDescription>{template.descriptionVi}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {fields.map((field: any) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  rows={4}
                  data-testid={`input-${field.name}`}
                />
              ) : field.type === "file" ? (
                <Input
                  id={field.name}
                  type="file"
                  onChange={(e) => handleInputChange(field.name, e.target.files?.[0]?.name || "")}
                  required={field.required}
                  data-testid={`input-${field.name}`}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  data-testid={`input-${field.name}`}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Chi phí: </span>
              <span className="font-mono font-semibold text-primary">{template.creditCost}</span>
              <span className="text-muted-foreground ml-1">credits</span>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={executeMutation.isPending}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={executeMutation.isPending}
                data-testid="button-execute"
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang thực thi...
                  </>
                ) : (
                  "Thực thi"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
