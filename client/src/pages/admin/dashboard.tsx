import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Zap, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoute } from "@/components/admin-route";

interface AdminStats {
  totalUsers: number;
  totalExecutions: number;
  totalRevenue: number;
  activeTemplates: number;
}

function AdminDashboardContent() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-600/10 border border-orange-500/20 text-orange-600 text-sm font-semibold mb-6 shadow-sm">
          <Shield className="w-4 h-4" />
          <span>Admin Dashboard</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Tổng quan hệ thống
        </h1>
        <p className="text-lg text-slate-600">
          Theo dõi và quản lý toàn bộ hệ thống WFA Hub
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200/60 shadow-xl" data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Tổng người dùng
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent" data-testid="stat-total-users">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Người dùng đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-cyan-50/30 border-2 border-cyan-200/60 shadow-xl" data-testid="card-total-executions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Tổng thực thi
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent" data-testid="stat-total-executions">
              {stats?.totalExecutions || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Workflows đã chạy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-orange-50/30 border-2 border-orange-200/60 shadow-xl" data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Tổng doanh thu
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent" data-testid="stat-total-revenue">
              {stats?.totalRevenue || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Credits đã sử dụng</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200/60 shadow-xl" data-testid="card-active-templates">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Templates
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent" data-testid="stat-active-templates">
              {stats?.activeTemplates || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Templates đang hoạt động</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
