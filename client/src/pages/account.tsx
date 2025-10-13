import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, Wallet, CreditCard, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Đã đăng xuất",
        description: "Hẹn gặp lại bạn!",
      });
    },
  });

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleTopUp = () => {
    toast({
      title: "Tính năng đang phát triển",
      description: "Tính năng nạp credits sẽ sớm được ra mắt.",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tài khoản</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin cá nhân và số dư credits
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.profileImageUrl || undefined} style={{ objectFit: 'cover' }} />
              <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-1" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : "Người dùng"}
              </h2>
              <p className="text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Thông tin cá nhân
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || "-"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Họ</span>
              <span className="font-medium">{user?.lastName || "-"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Tên</span>
              <span className="font-medium">{user?.firstName || "-"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">ID tài khoản</span>
              <span className="font-mono text-sm">{user?.id || "-"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Số dư Credits
          </h3>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại</p>
              <p className="text-3xl font-bold font-mono" data-testid="text-credits-balance">
                {user?.credits || 0}
                <span className="text-base font-normal text-muted-foreground ml-2">credits</span>
              </p>
            </div>
            <Button 
              onClick={handleTopUp} 
              className="gap-2"
              data-testid="button-topup"
            >
              <CreditCard className="w-4 h-4" />
              Nạp thêm
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Mỗi tính năng tự động hóa sẽ tiêu tốn một lượng credits nhất định. 
              Nạp thêm credits để tiếp tục sử dụng các tính năng.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Đăng xuất</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Đăng xuất khỏi tài khoản của bạn
          </p>
          <Button 
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="gap-2"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
