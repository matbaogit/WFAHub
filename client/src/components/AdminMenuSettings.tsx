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
import { useAdminMenuPreferences } from "@/hooks/useAdminMenuPreferences";
import { Shield, Users, Zap, Server, BarChart3, RotateCcw } from "lucide-react";

interface AdminMenuSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MENU_ITEMS = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield },
  { id: 'admin-users', label: 'Quản lý Users', icon: Users },
  { id: 'admin-templates', label: 'Quản lý Templates', icon: Zap },
  { id: 'admin-smtp', label: 'SMTP Hệ thống', icon: Server },
  { id: 'admin-stats', label: 'Thống kê', icon: BarChart3 },
];

export function AdminMenuSettings({ open, onOpenChange }: AdminMenuSettingsProps) {
  const { preferences, toggleMenuItem, resetToDefaults } = useAdminMenuPreferences();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-admin-menu-settings">
        <DialogHeader>
          <DialogTitle>Cài đặt Menu Admin</DialogTitle>
          <DialogDescription>
            Chọn menu items bạn muốn hiển thị trong sidebar admin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox
                  id={item.id}
                  checked={preferences[item.id] ?? true}
                  onCheckedChange={() => toggleMenuItem(item.id)}
                  data-testid={`checkbox-${item.id}`}
                />
                <Label
                  htmlFor={item.id}
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Label>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefaults}
            data-testid="button-reset-menu-settings"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Đặt lại mặc định
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-menu-settings"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
