import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, FileText, Users, Mail } from "lucide-react";

interface AnalyticsData {
  totalQuotations: number;
  totalCustomers: number;
  totalRevenue: number;
  emailsSent: number;
  quotationsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topCustomers: { name: string; totalSpent: number }[];
}

function StatCard({ icon: Icon, title, value, subtitle, color }: any) {
  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

export default function Analytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-500/20 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Phân tích & Thống kê
        </h1>
        <p className="text-lg text-muted-foreground">
          Tổng quan hiệu suất kinh doanh và báo giá
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          title="Tổng báo giá"
          value={data?.totalQuotations || 0}
          color="text-blue-600"
        />
        <StatCard
          icon={Users}
          title="Khách hàng"
          value={data?.totalCustomers || 0}
          color="text-green-600"
        />
        <StatCard
          icon={DollarSign}
          title="Tổng doanh thu"
          value={`${(data?.totalRevenue || 0).toLocaleString("vi-VN")} VNĐ`}
          color="text-purple-600"
        />
        <StatCard
          icon={Mail}
          title="Email đã gửi"
          value={data?.emailsSent || 0}
          color="text-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotations by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Báo giá theo trạng thái
          </h3>
          <div className="space-y-3">
            {data?.quotationsByStatus?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="capitalize">{item.status}</span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top khách hàng
          </h3>
          <div className="space-y-3">
            {data?.topCustomers?.slice(0, 5).map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <span>{customer.name}</span>
                </div>
                <span className="font-semibold">{customer.totalSpent.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
