import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileSpreadsheet, CheckCircle } from "lucide-react";
import type { ServiceCatalog } from "@shared/schema";

export default function ServiceCatalogPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<{
    headers: string[];
    previewData: any[][];
    totalRows: number;
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<{
    name?: number;
    description?: number;
    unitPrice?: number;
    unit?: number;
    category?: number;
  }>({});

  const { data: catalog = [], isLoading } = useQuery<ServiceCatalog[]>({
    queryKey: ["/api/service-catalog"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/service-catalog/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUploadData(data);
      toast({
        title: "File uploaded",
        description: `Found ${data.totalRows} rows`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mapping", JSON.stringify(columnMapping));
      
      const response = await fetch("/api/service-catalog/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({
        title: "Import successful",
        description: `Imported ${data.imported} items`,
      });
      setSelectedFile(null);
      setUploadData(null);
      setColumnMapping({});
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/service-catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({
        title: "Item deleted",
        description: "Service catalog item has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadMutation.mutate(file);
    }
  };

  const handleImport = () => {
    if (!columnMapping.name || columnMapping.unitPrice === undefined) {
      toast({
        title: "Mapping incomplete",
        description: "Please map at least Name and Unit Price columns",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-catalog-title">Danh Mục Dịch Vụ</h1>
          <p className="text-muted-foreground">Import và quản lý danh mục dịch vụ từ Excel/CSV</p>
        </div>
      </div>

      {!uploadData ? (
        <Card>
          <CardHeader>
            <CardTitle>Import từ File</CardTitle>
            <CardDescription>
              Upload file Excel hoặc CSV chứa danh sách dịch vụ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploadMutation.isPending}
                data-testid="input-file-upload"
              />
              {uploadMutation.isPending && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              File cần có các cột: Tên dịch vụ, Mô tả, Đơn giá, Đơn vị, Danh mục
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Ánh xạ cột (Column Mapping)
              </CardTitle>
              <CardDescription>
                Chọn cột tương ứng với từng trường dữ liệu. Tên dịch vụ và Đơn giá là bắt buộc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên dịch vụ (bắt buộc) *</Label>
                  <Select
                    value={columnMapping.name?.toString()}
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, name: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-name-column">
                      <SelectValue placeholder="Chọn cột..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mô tả</Label>
                  <Select
                    value={columnMapping.description?.toString()}
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, description: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-description-column">
                      <SelectValue placeholder="Chọn cột..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Đơn giá (bắt buộc) *</Label>
                  <Select
                    value={columnMapping.unitPrice?.toString()}
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, unitPrice: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-price-column">
                      <SelectValue placeholder="Chọn cột..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Đơn vị</Label>
                  <Select
                    value={columnMapping.unit?.toString()}
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, unit: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-unit-column">
                      <SelectValue placeholder="Chọn cột..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={columnMapping.category?.toString()}
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, category: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-category-column">
                      <SelectValue placeholder="Chọn cột..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || !columnMapping.name || columnMapping.unitPrice === undefined}
                  className="flex items-center gap-2"
                  data-testid="button-import"
                >
                  <CheckCircle className="w-4 h-4" />
                  {importMutation.isPending ? "Đang import..." : "Import"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadData(null);
                    setSelectedFile(null);
                    setColumnMapping({});
                  }}
                  data-testid="button-cancel"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Xem trước dữ liệu</CardTitle>
              <CardDescription>5 dòng đầu tiên từ file của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {uploadData.headers.map((header, idx) => (
                        <TableHead key={idx}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadData.previewData.map((row, idx) => (
                      <TableRow key={idx}>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh mục hiện tại ({catalog.length})</CardTitle>
          <CardDescription>Danh sách các dịch vụ đã import</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dịch vụ nào. Import file để bắt đầu.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên dịch vụ</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>
                        {item.name}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell data-testid={`text-price-${item.id}`}>
                        {(item.unitPrice || 0).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
