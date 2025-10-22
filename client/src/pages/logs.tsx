import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { ExecutionLog, Template } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface LogWithTemplate extends ExecutionLog {
  template?: Template;
}

export default function Logs() {
  const { data: logs, isLoading, isError, error, refetch } = useQuery<LogWithTemplate[]>({
    queryKey: ["/api/logs"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="gap-1 bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20">
            <CheckCircle className="w-3 h-3" />
            Thành công
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Thất bại
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Đang xử lý
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Lịch sử sử dụng</h1>
        <p className="text-muted-foreground">
          Xem lại các tính năng đã thực thi
        </p>
      </div>

      {isError ? (
        <div className="text-center py-12 bg-card rounded-xl border border-destructive/20">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Không thể tải lịch sử</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải lịch sử thực thi"}
          </p>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-retry-logs">
            Thử lại
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Tính năng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tín dụng sử dụng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                  <TableCell className="font-medium">
                    {log.executedAt ? format(new Date(log.executedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "-"}
                  </TableCell>
                  <TableCell>{log.template?.nameVi || "Không xác định"}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold">{log.creditsUsed}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có lịch sử</h3>
          <p className="text-muted-foreground">
            Các tính năng bạn thực thi sẽ được ghi nhận tại đây
          </p>
        </div>
      )}
    </div>
  );
}
