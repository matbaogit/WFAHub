import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Users, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { BulkCampaign } from "@shared/schema";
import { format } from "date-fns";

export default function BulkCampaignsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<BulkCampaign[]>({
    queryKey: ["/api/bulk-campaigns"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bulk-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      toast({ title: "Thành công", description: "Đã xóa chiến dịch" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "sending" || c.status === "scheduled").length;
  const completedCampaigns = campaigns.filter(c => c.status === "completed").length;
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: "secondary", label: "Nháp", icon: Clock },
      scheduled: { variant: "default", label: "Đã lên lịch", icon: Clock },
      sending: { variant: "default", label: "Đang gửi", icon: Mail },
      completed: { variant: "default", label: "Hoàn thành", icon: CheckCircle },
      failed: { variant: "destructive", label: "Thất bại", icon: XCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Chiến dịch Email Hàng Loạt
          </h1>
          <p className="text-slate-500 mt-1">
            Gửi báo giá đến nhiều khách hàng cùng lúc
          </p>
        </div>
        <Link href="/bulk-campaigns/new">
          <Button size="default" className="gap-2" data-testid="button-create-campaign">
            <Plus className="w-4 h-4" />
            Tạo chiến dịch mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng chiến dịch</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600" data-testid="text-total-campaigns">
              {totalCampaigns}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang hoạt động</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600" data-testid="text-active-campaigns">
              {activeCampaigns}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã hoàn thành</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-600" data-testid="text-completed-campaigns">
              {completedCampaigns}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng email đã gửi</CardDescription>
            <CardTitle className="text-3xl font-bold text-purple-600" data-testid="text-total-emails-sent">
              {totalEmailsSent}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chiến dịch</CardTitle>
          <CardDescription>
            Quản lý các chiến dịch email hàng loạt của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Chưa có chiến dịch nào</p>
              <Link href="/bulk-campaigns/new">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo chiến dịch đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chiến dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead>Đã gửi</TableHead>
                  <TableHead>Thất bại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setLocation(`/bulk-campaigns/${campaign.id}`)}
                    data-testid={`row-campaign-${campaign.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span data-testid={`text-total-recipients-${campaign.id}`}>
                          {campaign.totalRecipients}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium" data-testid={`text-sent-count-${campaign.id}`}>
                        {campaign.sentCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium" data-testid={`text-failed-count-${campaign.id}`}>
                        {campaign.failedCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {campaign.createdAt && format(new Date(campaign.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Bạn có chắc muốn xóa chiến dịch này?")) {
                            deleteMutation.mutate(campaign.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${campaign.id}`}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
