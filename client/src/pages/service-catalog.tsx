import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Trash2, FileSpreadsheet, CheckCircle, HelpCircle, Search, X } from "lucide-react";
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
    unit?: number | "manual" | "extract";
    category?: number;
  }>({});
  const [priceFormat, setPriceFormat] = useState<"dot" | "comma">("dot");
  const [manualUnit, setManualUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: catalog = [], isLoading } = useQuery<ServiceCatalog[]>({
    queryKey: ["/api/service-catalog"],
  });

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(catalog.map(item => item.category).filter(Boolean));
    return Array.from(cats);
  }, [catalog]);

  // Filter and search catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchTerm, categoryFilter]);

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
      
      const mappingData = {
        ...columnMapping,
        priceFormat,
        manualUnit: columnMapping.unit === "manual" ? manualUnit : undefined,
      };
      
      formData.append("mapping", JSON.stringify(mappingData));
      
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
      setManualUnit("");
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
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/service-catalog/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setSelectedItems(new Set());
      toast({
        title: "Items deleted",
        description: `Deleted ${selectedItems.size} items`,
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
    if (columnMapping.unit === "manual" && !manualUnit.trim()) {
      toast({
        title: "Unit required",
        description: "Please enter a unit value",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedItems.size === filteredCatalog.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredCatalog.map(item => item.id)));
    }
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Tên dịch vụ (bắt buộc) *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chọn cột chứa tên dịch vụ/sản phẩm</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Mô tả</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chọn cột chứa mô tả chi tiết dịch vụ</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Đơn giá (bắt buộc) *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chọn cột chứa giá tiền</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Định dạng giá</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Chọn dấu phân cách số trong file:</p>
                        <p>• Dấu chấm: 1.000.000 hoặc 1000000</p>
                        <p>• Dấu phẩy: 1,000,000</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <RadioGroup value={priceFormat} onValueChange={(v: "dot" | "comma") => setPriceFormat(v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dot" id="dot" data-testid="radio-price-dot" />
                      <Label htmlFor="dot">Dấu chấm (1.000.000)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="comma" id="comma" data-testid="radio-price-comma" />
                      <Label htmlFor="comma">Dấu phẩy (1,000,000)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Đơn vị</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Chọn nguồn đơn vị:</p>
                        <p>• Từ cột: Lấy từ cột riêng</p>
                        <p>• Extract từ giá: Tự động tách từ cột giá (ví dụ: "49.000 đ/tháng" → "tháng")</p>
                        <p>• Nhập thủ công: Điền đơn vị cố định cho tất cả</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={columnMapping.unit?.toString() || ""}
                    onValueChange={(v) => {
                      if (v === "manual" || v === "extract") {
                        setColumnMapping({ ...columnMapping, unit: v });
                      } else {
                        setColumnMapping({ ...columnMapping, unit: parseInt(v) });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-unit-source">
                      <SelectValue placeholder="Chọn nguồn..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Nhập thủ công</SelectItem>
                      <SelectItem value="extract">Extract từ cột giá</SelectItem>
                      {uploadData.headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          Từ cột: {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {columnMapping.unit === "manual" && (
                    <Input
                      placeholder="Nhập đơn vị (vd: giờ, ngày, tháng, bộ...)"
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      data-testid="input-manual-unit"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Danh mục</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chọn cột chứa phân loại dịch vụ</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                    setManualUnit("");
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
          <CardTitle className="flex items-center justify-between">
            <span>Danh mục hiện tại ({filteredCatalog.length})</span>
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
                disabled={bulkDeleteMutation.isPending}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa {selectedItems.size} mục
              </Button>
            )}
          </CardTitle>
          <CardDescription>Danh sách các dịch vụ đã import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                <SelectValue placeholder="Lọc danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ""}>
                    {cat || "(Không có danh mục)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : filteredCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {catalog.length === 0 
                ? "Chưa có dịch vụ nào. Import file để bắt đầu."
                : "Không tìm thấy kết quả phù hợp."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size === filteredCatalog.length && filteredCatalog.length > 0}
                        onCheckedChange={toggleAllSelection}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Tên dịch vụ</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCatalog.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          data-testid={`checkbox-${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>
                        {item.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
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
