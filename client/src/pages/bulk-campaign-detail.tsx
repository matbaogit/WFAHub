import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Download,
  Search,
  Send,
  AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface CampaignRecipient {
  id: string;
  email: string;
  name: string | null;
  status: string;
  openedAt: Date | null;
  sentAt: Date | null;
  errorMessage: string | null;
}

interface CampaignDetails {
  id: string;
  name: string;
  emailSubject: string;
  emailBody: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  sendRate: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  recipients: CampaignRecipient[];
}

export default function BulkCampaignDetail() {
  const [, params] = useRoute("/bulk-campaigns/:id");
  const campaignId = params?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: campaign, isLoading } = useQuery<CampaignDetails>({
    queryKey: ["/api/bulk-campaigns", campaignId],
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Campaign not found</p>
              <Link href="/bulk-campaigns">
                <Button className="mt-4" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRecipients = campaign.recipients.filter((recipient) => {
    const matchesSearch =
      searchQuery === "" ||
      recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipient.name && recipient.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || recipient.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Chờ gửi", icon: Clock },
      sent: { variant: "default", label: "Đã gửi", icon: Send },
      failed: { variant: "destructive", label: "Thất bại", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCampaignStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Nháp" },
      scheduled: { variant: "default", label: "Đã lên lịch" },
      sending: { variant: "default", label: "Đang gửi" },
      completed: { variant: "default", label: "Hoàn thành" },
      failed: { variant: "destructive", label: "Thất bại" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const progressPercentage = campaign.totalRecipients > 0
    ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
    : 0;

  const openRate = campaign.sentCount > 0
    ? Math.round((campaign.openedCount / campaign.sentCount) * 100)
    : 0;

  const chartData = [
    { name: "Tổng số", value: campaign.totalRecipients, fill: "#3b82f6" },
    { name: "Đã gửi", value: campaign.sentCount, fill: "#10b981" },
    { name: "Đã mở", value: campaign.openedCount, fill: "#8b5cf6" },
    { name: "Thất bại", value: campaign.failedCount, fill: "#ef4444" },
  ];

  const handleExportCSV = () => {
    const headers = ["Email", "Tên", "Trạng thái", "Đã gửi", "Đã mở", "Lỗi"];
    const rows = filteredRecipients.map((r) => [
      r.email,
      r.name || "",
      r.status,
      r.sentAt ? format(new Date(r.sentAt), "dd/MM/yyyy HH:mm") : "",
      r.openedAt ? format(new Date(r.openedAt), "dd/MM/yyyy HH:mm") : "",
      r.errorMessage || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign_${campaign.id}_recipients.csv`);
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bulk-campaigns">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-campaign-name">
              {campaign.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(campaign.createdAt), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
        </div>
        {getCampaignStatusBadge(campaign.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold" data-testid="text-total-recipients">
                  {campaign.totalRecipients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold" data-testid="text-sent-count">
                  {campaign.sentCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opened</p>
                <p className="text-2xl font-bold" data-testid="text-opened-count">
                  {campaign.openedCount}
                </p>
                <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold" data-testid="text-failed-count">
                  {campaign.failedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Progress</CardTitle>
          <CardDescription>
            {progressPercentage}% complete • {campaign.sentCount} of {campaign.totalRecipients} sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="mb-4" data-testid="progress-campaign" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Details</CardTitle>
              <CardDescription>Campaign email content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
            <p className="text-sm" data-testid="text-email-subject">{campaign.emailSubject}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Body:</p>
            <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-y-auto" data-testid="text-email-body">
              {campaign.emailBody}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recipients ({filteredRecipients.length})</CardTitle>
              <CardDescription>Manage and track campaign recipients</CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-recipients"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Chờ gửi</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Opened At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No recipients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <TableRow key={recipient.id} data-testid={`row-recipient-${recipient.id}`}>
                      <TableCell className="font-medium">{recipient.email}</TableCell>
                      <TableCell>{recipient.name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(recipient.status)}</TableCell>
                      <TableCell>
                        {recipient.sentAt
                          ? format(new Date(recipient.sentAt), "dd/MM/yyyy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {recipient.openedAt ? (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Eye className="w-3 h-3" />
                            {format(new Date(recipient.openedAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {recipient.errorMessage ? (
                          <span className="text-xs text-destructive truncate max-w-xs block">
                            {recipient.errorMessage}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
