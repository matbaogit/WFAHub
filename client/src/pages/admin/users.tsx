import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Shield, Coins, Crown, Mail, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { User, SmtpConfig } from "@shared/schema";
import { AdminRoute } from "@/components/admin-route";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

function AdminUsersContent() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: smtpConfigs } = useQuery<SmtpConfig[]>({
    queryKey: ["/api/admin/smtp-configs"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin người dùng",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật người dùng",
        variant: "destructive",
      });
    },
  });

  const setSystemDefaultMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", "/api/admin/smtp-config/set-system-default", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smtp-configs"] });
      toast({
        title: "Thành công",
        description: "Đã đặt SMTP config làm mặc định hệ thống",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đặt SMTP mặc định hệ thống",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserToDelete(null);
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa người dùng",
        variant: "destructive",
      });
    },
  });

  const getUserSmtpConfig = (userId: string) => {
    return smtpConfigs?.find(config => config.userId === userId);
  };

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
          <Users className="w-4 h-4" />
          <span>Quản lý người dùng</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Danh sách người dùng
        </h1>
        <p className="text-lg text-slate-600">
          Quản lý tín dụng và quyền của người dùng
        </p>
      </div>

      <div className="space-y-4">
        {users?.map((user) => {
          const smtpConfig = getUserSmtpConfig(user.id);
          return (
          <Card key={user.id} className="bg-gradient-to-br from-white to-slate-50/30 border-2 border-slate-200/60 shadow-lg p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  user.role === "admin" 
                    ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30" 
                    : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                }`}>
                  {user.role === "admin" ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.email}
                    </h3>
                    {user.role === "admin" && (
                      <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-600/10 border border-orange-500/20 text-orange-600 text-xs font-semibold">
                        Admin
                      </span>
                    )}
                    {smtpConfig && (
                      <>
                        <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 text-green-600 text-xs font-semibold flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          SMTP
                        </span>
                        {smtpConfig.isSystemDefault === 1 && (
                          <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 text-yellow-600 text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Mặc định hệ thống
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  {smtpConfig && (
                    <p className="text-xs text-slate-400 mt-1">
                      SMTP: {smtpConfig.fromEmail} ({smtpConfig.host}:{smtpConfig.port})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {editingUser === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      className="w-24 h-9"
                      placeholder="Tín dụng"
                      data-testid={`input-credits-${user.id}`}
                    />
                    <Button
                      size="sm"
                      onClick={() => updateUserMutation.mutate({ 
                        userId: user.id, 
                        data: { credits } 
                      })}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                      <Coins className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-blue-600">{user.credits}</span>
                      <span className="text-sm text-slate-500">tín dụng</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(user.id);
                        setCredits(user.credits);
                      }}
                      className="rounded-xl"
                      data-testid={`button-edit-${user.id}`}
                    >
                      Chỉnh sửa
                    </Button>
                    {smtpConfig && smtpConfig.isSystemDefault !== 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSystemDefaultMutation.mutate(user.id)}
                        className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border-yellow-500/30 text-yellow-700 hover:from-yellow-500/20 hover:to-amber-600/20 rounded-xl"
                        disabled={setSystemDefaultMutation.isPending}
                        data-testid={`button-set-default-smtp-${user.id}`}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Đặt SMTP mặc định
                      </Button>
                    )}
                    {user.role !== "admin" && (
                      <Button
                        size="sm"
                        onClick={() => updateUserMutation.mutate({ 
                          userId: user.id, 
                          data: { role: "admin" } 
                        })}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl"
                        data-testid={`button-make-admin-${user.id}`}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Cấp Admin
                      </Button>
                    )}
                    {user.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUserToDelete(user)}
                        className="border-red-500/30 text-red-600 hover:bg-red-50 rounded-xl"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.email}</strong>?
              <br />
              <span className="text-red-600 font-semibold">
                Hành động này không thể hoàn tác!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Xóa người dùng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminUsers() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  );
}
