import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Mail, 
  Send,
  CheckCircle,
  Clock,
  ArrowRight,
  CreditCard,
  BarChart3,
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface DashboardStats {
  user: any;
  stats: {
    credits: number;
    campaignCount: number;
    completedCampaigns: number;
    quotationCount: number;
  };
  recentActivities: any[];
  recentCampaigns: any[];
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isError) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="text-center py-16 bg-card rounded-xl border border-destructive/20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Không thể tải dữ liệu</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Đã xảy ra lỗi"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || { credits: 0, campaignCount: 0, completedCampaigns: 0, quotationCount: 0 };
  const recentActivities = data?.recentActivities || [];
  const recentCampaigns = data?.recentCampaigns || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-blue-600 text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Tự động hóa thông minh</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Chào mừng trở lại!
        </h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động và thống kê của bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover-elevate" data-testid="card-credits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tín dụng còn lại</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.credits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dùng cho tự động hóa
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-campaigns">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiến dịch Email</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaignCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedCampaigns} hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-quotations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Báo giá</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng số báo giá
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Thao tác nhanh
          </CardTitle>
          <CardDescription>Các tính năng thường dùng</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 hover-elevate"
            onClick={() => navigate("/bulk-campaigns/new")}
            data-testid="button-quick-bulk-campaign"
          >
            <Mail className="w-8 h-8 mb-2 text-blue-600" />
            <span className="font-semibold">Gửi Email Hàng Loạt</span>
            <span className="text-xs text-muted-foreground mt-1">
              Tạo chiến dịch mới
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 hover-elevate"
            onClick={() => navigate("/quotations")}
            data-testid="button-quick-quotation"
          >
            <FileText className="w-8 h-8 mb-2 text-blue-600" />
            <span className="font-semibold">Tạo Báo Giá</span>
            <span className="text-xs text-muted-foreground mt-1">
              Quản lý báo giá
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 hover-elevate"
            onClick={() => navigate("/service-catalog")}
            data-testid="button-quick-catalog"
          >
            <Package className="w-8 h-8 mb-2 text-blue-600" />
            <span className="font-semibold">Bảng Giá</span>
            <span className="text-xs text-muted-foreground mt-1">
              Danh mục dịch vụ
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 hover-elevate"
            onClick={() => navigate("/templates")}
            data-testid="button-quick-templates"
          >
            <Sparkles className="w-8 h-8 mb-2 text-blue-600" />
            <span className="font-semibold">Tính Năng</span>
            <span className="text-xs text-muted-foreground mt-1">
              Xem tất cả
            </span>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <Card data-testid="card-recent-activities">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Hoạt động gần đây
            </CardTitle>
            <CardDescription>Lịch sử thực thi tính năng</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Chưa có hoạt động nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.status === 'success' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {activity.template?.nameVi || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.creditsUsed} tín dụng • {formatDistanceToNow(new Date(activity.executedAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("/logs")}
                    data-testid="button-view-all-logs"
                  >
                    Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card data-testid="card-recent-campaigns">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Chiến dịch gần đây
            </CardTitle>
            <CardDescription>Email campaigns mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Chưa có chiến dịch nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => navigate(`/bulk-campaigns/${campaign.id}`)}
                    data-testid={`campaign-${campaign.id}`}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {campaign.campaignName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          campaign.status === 'completed' ? 'default' :
                          campaign.status === 'sending' ? 'secondary' :
                          campaign.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {campaign.status === 'completed' ? 'Hoàn thành' :
                           campaign.status === 'sending' ? 'Đang gửi' :
                           campaign.status === 'failed' ? 'Thất bại' : campaign.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {campaign.sentCount || 0}/{campaign.recipientCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentCampaigns.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("/bulk-campaigns")}
                    data-testid="button-view-all-campaigns"
                  >
                    Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
