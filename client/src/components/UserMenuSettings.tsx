import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Home, Zap, Mail, Layout, Server, Package, UserCheck, BarChart3, History, User as UserIcon, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

interface UserMenuSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SystemSettings {
  id: string;
  userMenuVisibility: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

const USER_MENU_ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'templates', label: 'Tính năng', icon: Zap },
  { id: 'bulk-campaigns', label: 'Chiến dịch Gửi Email', icon: Mail },
  { id: 'quotation-templates', label: 'Mẫu tệp đính kèm', icon: Layout },
  { id: 'email-templates', label: 'Mẫu nội dung email', icon: Mail },
  { id: 'smtp-config', label: 'Cấu hình SMTP', icon: Server },
  { id: 'service-catalog', label: 'Danh Mục Dịch Vụ', icon: Package },
  { id: 'customers', label: 'Khách hàng', icon: UserCheck },
  { id: 'analytics', label: 'Phân tích', icon: BarChart3 },
  { id: 'logs', label: 'Lịch sử', icon: History },
  { id: 'account', label: 'Tài khoản', icon: UserIcon },
];

const DEFAULT_VISIBILITY = USER_MENU_ITEMS.reduce((acc, item) => {
  acc[item.id] = true;
  return acc;
}, {} as Record<string, boolean>);

export function UserMenuSettings({ open, onOpenChange }: UserMenuSettingsProps) {
  const { toast } = useToast();
  const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>(DEFAULT_VISIBILITY);

  const { data: systemSettings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/system-settings'],
    enabled: open,
  });

  useEffect(() => {
    if (systemSettings?.userMenuVisibility) {
      setLocalVisibility(systemSettings.userMenuVisibility);
    }
  }, [systemSettings]);

  const updateMutation = useMutation({
    mutationFn: async (visibility: Record<string, boolean>) => {
      const res = await apiRequest('PATCH', '/api/admin/system-settings', {
        userMenuVisibility: visibility,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
      toast({
        title: "Đã lưu",
        description: "Cài đặt menu đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const toggleMenuItem = (menuId: string) => {
    const newVisibility = {
      ...localVisibility,
      [menuId]: !localVisibility[menuId],
    };
    setLocalVisibility(newVisibility);
    updateMutation.mutate(newVisibility);
  };

  const resetToDefaults = () => {
    setLocalVisibility(DEFAULT_VISIBILITY);
    updateMutation.mutate(DEFAULT_VISIBILITY);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-user-menu-settings" className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cài đặt Menu Người dùng</DialogTitle>
          <DialogDescription>
            Chọn menu items hiển thị cho tất cả người dùng thường trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Đang tải...
            </div>
          ) : (
            USER_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`user-menu-${item.id}`}
                    checked={localVisibility[item.id] ?? true}
                    onCheckedChange={() => toggleMenuItem(item.id)}
                    data-testid={`checkbox-user-menu-${item.id}`}
                    disabled={updateMutation.isPending}
                  />
                  <Label
                    htmlFor={`user-menu-${item.id}`}
                    className="flex items-center gap-2 cursor-pointer font-normal"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Label>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefaults}
            data-testid="button-reset-user-menu-settings"
            disabled={updateMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Hiện tất cả
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-user-menu-settings"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
