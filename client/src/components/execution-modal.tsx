import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Template } from "@shared/schema";
import { CheckCircle, Loader2, Sparkles, Zap } from "lucide-react";
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
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-in zoom-in duration-500">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Thực thi thành công!
            </h3>
            <p className="text-slate-600 text-center max-w-sm">
              Tính năng đã được thực thi và ghi nhận vào lịch sử của bạn
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50/50 rounded-3xl">
        <DialogHeader className="pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {template.nameVi}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 text-base">
            {template.descriptionVi}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {fields.map((field: any) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-semibold text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  rows={4}
                  className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all rounded-xl bg-white"
                  data-testid={`input-${field.name}`}
                />
              ) : field.type === "file" ? (
                <Input
                  id={field.name}
                  type="file"
                  onChange={(e) => handleInputChange(field.name, e.target.files?.[0]?.name || "")}
                  required={field.required}
                  className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all rounded-xl h-12 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-blue-600 file:text-white file:font-semibold"
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
                  className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all rounded-xl h-12 bg-white"
                  data-testid={`input-${field.name}`}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-6 border-t border-slate-200/60">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-600">Chi phí: </span>
              <span className="font-mono font-bold text-blue-600">{template.creditCost}</span>
              <span className="text-sm text-slate-500">credits</span>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={executeMutation.isPending}
                className="rounded-xl border-2 hover:bg-slate-100"
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={executeMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 rounded-xl"
                data-testid="button-execute"
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang thực thi...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Thực thi
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
