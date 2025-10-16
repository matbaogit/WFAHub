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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, FileSpreadsheet, CheckCircle, HelpCircle, Search, X, Plus, Edit, ChevronRight, List, ChevronLeft, Package } from "lucide-react";
import type { ServiceCatalog, PriceList } from "@shared/schema";

type ImportStep = "select-price-list" | "upload-and-map";
type PriceListView = "list" | "detail";

export default function ServiceCatalogPage() {
  const { toast } = useToast();
  
  // Price List View State
  const [priceListView, setPriceListView] = useState<PriceListView>("list");
  const [selectedPriceListForView, setSelectedPriceListForView] = useState<PriceList | null>(null);
  
  // Price List State
  const [priceListDialogOpen, setPriceListDialogOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [priceListForm, setPriceListForm] = useState({ name: "", description: "" });
  
  // Import State
  const [importStep, setImportStep] = useState<ImportStep>("select-price-list");
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>("");
  const [createNewPriceList, setCreateNewPriceList] = useState(false);
  const [newPriceListName, setNewPriceListName] = useState("");
  const [newPriceListDescription, setNewPriceListDescription] = useState("");
  
  // File Upload State
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
  
  // Catalog View State (for detail view)
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch Price Lists
  const { data: priceLists = [], isLoading: priceListsLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  // Fetch Catalog
  const { data: catalog = [], isLoading: catalogLoading } = useQuery<ServiceCatalog[]>({
    queryKey: ["/api/service-catalog"],
  });

  // Get services for selected price list
  const servicesForSelectedPriceList = useMemo(() => {
    if (!selectedPriceListForView) return [];
    return catalog.filter(item => item.priceListId === selectedPriceListForView.id);
  }, [catalog, selectedPriceListForView]);

  // Get unique categories for filter (from selected price list only)
  const categories = useMemo(() => {
    const cats = new Set(servicesForSelectedPriceList.map(item => item.category).filter(Boolean));
    return Array.from(cats);
  }, [servicesForSelectedPriceList]);

  // Filter and search catalog (in detail view)
  const filteredCatalog = useMemo(() => {
    return servicesForSelectedPriceList.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [servicesForSelectedPriceList, searchTerm, categoryFilter]);

  // Get price list name by ID
  const getPriceListName = (priceListId: string | null) => {
    if (!priceListId) return "-";
    const priceList = priceLists.find(pl => pl.id === priceListId);
    return priceList?.name || "-";
  };

  // Price List Mutations
  const createPriceListMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await apiRequest("POST", "/api/price-lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setPriceListDialogOpen(false);
      setPriceListForm({ name: "", description: "" });
      toast({ title: "Thành công", description: "Đã tạo bảng giá mới" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updatePriceListMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string }) => {
      return await apiRequest("PATCH", `/api/price-lists/${data.id}`, { name: data.name, description: data.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setEditingPriceList(null);
      setPriceListDialogOpen(false);
      setPriceListForm({ name: "", description: "" });
      toast({ title: "Thành công", description: "Đã cập nhật bảng giá" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deletePriceListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: "Thành công", description: "Đã xóa bảng giá và các dịch vụ liên quan" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  // File Upload Mutations
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
        title: "Đã tải file lên",
        description: `Tìm thấy ${data.totalRows} dòng dữ liệu`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Tải file thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Chưa chọn file");
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const mappingData = {
        ...columnMapping,
        priceFormat,
        manualUnit: columnMapping.unit === "manual" ? manualUnit : undefined,
        priceListId: selectedPriceListId,
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
        title: "Import thành công",
        description: `Đã import ${data.imported} dịch vụ`,
      });
      resetImportState();
    },
    onError: (error: Error) => {
      toast({
        title: "Import thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Catalog Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/service-catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({
        title: "Đã xóa",
        description: "Đã xóa dịch vụ khỏi danh mục",
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
        title: "Đã xóa",
        description: `Đã xóa ${selectedItems.size} dịch vụ`,
      });
    },
  });

  // Handlers
  const resetImportState = () => {
    setSelectedFile(null);
    setUploadData(null);
    setColumnMapping({});
    setManualUnit("");
    setImportStep("select-price-list");
    setSelectedPriceListId("");
    setCreateNewPriceList(false);
    setNewPriceListName("");
    setNewPriceListDescription("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadMutation.mutate(file);
    }
  };

  const handleProceedToMapping = async () => {
    if (createNewPriceList) {
      if (!newPriceListName.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên bảng giá",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const response = await apiRequest("POST", "/api/price-lists", {
          name: newPriceListName,
          description: newPriceListDescription,
        });
        const newPriceList = await response.json() as PriceList;
        queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
        setSelectedPriceListId(newPriceList.id);
        setImportStep("upload-and-map");
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tạo bảng giá",
          variant: "destructive",
        });
      }
    } else {
      if (!selectedPriceListId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn bảng giá",
          variant: "destructive",
        });
        return;
      }
      setImportStep("upload-and-map");
    }
  };

  const handleImport = () => {
    if (!columnMapping.name || columnMapping.unitPrice === undefined) {
      toast({
        title: "Chưa đủ thông tin",
        description: "Vui lòng map ít nhất cột Tên và Đơn giá",
        variant: "destructive",
      });
      return;
    }
    if (columnMapping.unit === "manual" && !manualUnit.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đơn vị",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  const handleOpenPriceListDialog = (priceList?: PriceList) => {
    if (priceList) {
      setEditingPriceList(priceList);
      setPriceListForm({ name: priceList.name, description: priceList.description || "" });
    } else {
      setEditingPriceList(null);
      setPriceListForm({ name: "", description: "" });
    }
    setPriceListDialogOpen(true);
  };

  const handleSavePriceList = () => {
    if (!priceListForm.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên bảng giá",
        variant: "destructive",
      });
      return;
    }

    if (editingPriceList) {
      updatePriceListMutation.mutate({
        id: editingPriceList.id,
        name: priceListForm.name,
        description: priceListForm.description,
      });
    } else {
      createPriceListMutation.mutate(priceListForm);
    }
  };

  const handleViewPriceListDetail = (priceList: PriceList) => {
    setSelectedPriceListForView(priceList);
    setPriceListView("detail");
    // Reset filters
    setSearchTerm("");
    setCategoryFilter("all");
    setSelectedItems(new Set());
  };

  const handleBackToList = () => {
    setPriceListView("list");
    setSelectedPriceListForView(null);
    setSearchTerm("");
    setCategoryFilter("all");
    setSelectedItems(new Set());
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
          <h1 className="text-3xl font-bold" data-testid="text-catalog-title">Danh mục Dịch vụ</h1>
          <p className="text-muted-foreground">Quản lý bảng giá và import danh mục dịch vụ từ Excel/CSV</p>
        </div>
      </div>

      <Tabs defaultValue="price-lists" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-catalog-main">
          <TabsTrigger value="price-lists" data-testid="tab-price-lists">Bảng Giá</TabsTrigger>
          <TabsTrigger value="import" data-testid="tab-import">Import Dịch Vụ</TabsTrigger>
        </TabsList>

        {/* Price Lists Tab - List & Detail View */}
        <TabsContent value="price-lists" className="space-y-4">
          {priceListView === "list" ? (
            // List View - Show all price lists
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý Bảng Giá</CardTitle>
                    <CardDescription>Tạo và quản lý các bảng giá của bạn</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenPriceListDialog()} data-testid="button-create-price-list">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo Bảng Giá
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {priceListsLoading ? (
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                ) : priceLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có bảng giá. Tạo bảng giá đầu tiên để bắt đầu.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {priceLists.map((priceList) => (
                      <Card 
                        key={priceList.id} 
                        className="hover-elevate cursor-pointer transition-all"
                        onClick={() => handleViewPriceListDetail(priceList)}
                        data-testid={`card-price-list-${priceList.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Package className="w-5 h-5 text-primary" />
                                  <h3 className="font-semibold text-lg" data-testid={`text-price-list-name-${priceList.id}`}>
                                    {priceList.name}
                                  </h3>
                                </div>
                                {priceList.description && (
                                  <p className="text-sm text-muted-foreground mb-3">{priceList.description}</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {catalog.filter(item => item.priceListId === priceList.id).length} dịch vụ
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPriceListDialog(priceList);
                                }}
                                data-testid={`button-edit-price-list-${priceList.id}`}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Bạn có chắc? Thao tác này sẽ xóa tất cả dịch vụ liên quan.")) {
                                    deletePriceListMutation.mutate(priceList.id);
                                  }
                                }}
                                data-testid={`button-delete-price-list-${priceList.id}`}
                                className="flex-1"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Detail View - Show catalog for selected price list
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleBackToList}
                data-testid="button-back-to-price-lists"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Quay lại Danh sách Bảng Giá
              </Button>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <List className="w-5 h-5" />
                        {selectedPriceListForView?.name} ({filteredCatalog.length})
                      </CardTitle>
                      <CardDescription>
                        {selectedPriceListForView?.description || "Danh sách các dịch vụ trong bảng giá này"}
                      </CardDescription>
                    </div>
                    {selectedItems.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
                        disabled={bulkDeleteMutation.isPending}
                        data-testid="button-bulk-delete"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa {selectedItems.size} dịch vụ
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên hoặc mô tả..."
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
                          data-testid="button-clear-search"
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
                        <SelectItem value="all">Tất cả Danh mục</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat || ""}>
                            {cat || "(Không có danh mục)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {catalogLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                  ) : filteredCatalog.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || categoryFilter !== "all" 
                        ? "Không tìm thấy dịch vụ nào phù hợp" 
                        : "Chưa có dịch vụ trong bảng giá này"}
                    </p>
                  ) : (
                    <div className="border rounded-lg">
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
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>Danh mục</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCatalog.map((item) => (
                            <TableRow key={item.id} data-testid={`row-catalog-${item.id}`}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.has(item.id)}
                                  onCheckedChange={() => toggleItemSelection(item.id)}
                                  data-testid={`checkbox-item-${item.id}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-muted-foreground max-w-md truncate">
                                {item.description || "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.unitPrice.toLocaleString('vi-VN')} đ
                              </TableCell>
                              <TableCell>{item.unit || "-"}</TableCell>
                              <TableCell>
                                {item.category ? (
                                  <Badge variant="outline">{item.category}</Badge>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMutation.mutate(item.id)}
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
          )}
        </TabsContent>

        {/* Import Services Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Quy trình Import Nhiều Bước
                <Badge variant="outline" data-testid="text-current-step">
                  Bước {importStep === "select-price-list" ? "1" : "2"} / 2
                </Badge>
              </CardTitle>
              <CardDescription>
                {importStep === "select-price-list" 
                  ? "Chọn bảng giá hiện có hoặc tạo mới"
                  : "Tải lên và map file CSV/Excel"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importStep === "select-price-list" ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Chọn Bảng Giá</h3>
                      <p className="text-sm text-muted-foreground">Chọn nơi import dịch vụ</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-muted-foreground">Tải lên & Map</h3>
                      <p className="text-sm text-muted-foreground">Cấu hình ánh xạ cột</p>
                    </div>
                  </div>

                  <RadioGroup
                    value={createNewPriceList ? "new" : "existing"}
                    onValueChange={(v) => setCreateNewPriceList(v === "new")}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing" data-testid="radio-select-existing" />
                        <Label htmlFor="existing" className="font-semibold">Chọn Bảng Giá Hiện Có</Label>
                      </div>

                      {!createNewPriceList && (
                        <div className="ml-6 space-y-2">
                          {priceListsLoading ? (
                            <p className="text-sm text-muted-foreground">Đang tải bảng giá...</p>
                          ) : priceLists.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Chưa có bảng giá. Tạo mới trước.</p>
                          ) : (
                            <RadioGroup value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                              {priceLists.map((pl) => (
                                <div key={pl.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={pl.id} id={pl.id} data-testid={`radio-price-list-${pl.id}`} />
                                  <Label htmlFor={pl.id} className="flex-1 cursor-pointer">
                                    <div>
                                      <p className="font-medium">{pl.name}</p>
                                      {pl.description && (
                                        <p className="text-sm text-muted-foreground">{pl.description}</p>
                                      )}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new" data-testid="radio-create-new" />
                        <Label htmlFor="new" className="font-semibold">Tạo Bảng Giá Mới</Label>
                      </div>

                      {createNewPriceList && (
                        <div className="ml-6 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-price-list-name">Tên *</Label>
                            <Input
                              id="new-price-list-name"
                              placeholder="Nhập tên bảng giá"
                              value={newPriceListName}
                              onChange={(e) => setNewPriceListName(e.target.value)}
                              data-testid="input-new-price-list-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-price-list-description">Mô tả</Label>
                            <Textarea
                              id="new-price-list-description"
                              placeholder="Nhập mô tả (tùy chọn)"
                              value={newPriceListDescription}
                              onChange={(e) => setNewPriceListDescription(e.target.value)}
                              data-testid="input-new-price-list-description"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </RadioGroup>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleProceedToMapping} data-testid="button-continue-to-upload">
                      Tiếp tục đến Tải lên & Map
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border bg-muted">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-muted-foreground">Chọn Bảng Giá</h3>
                      <p className="text-sm text-muted-foreground">
                        {getPriceListName(selectedPriceListId)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Tải lên & Map</h3>
                      <p className="text-sm text-muted-foreground">Cấu hình ánh xạ cột</p>
                    </div>
                  </div>

                  {!uploadData ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          disabled={uploadMutation.isPending}
                          data-testid="input-file-upload"
                        />
                        {uploadMutation.isPending && (
                          <span className="text-sm text-muted-foreground">Đang tải lên...</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        File nên chứa các cột: Tên Dịch vụ, Mô tả, Đơn giá, Đơn vị, Danh mục
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setImportStep("select-price-list")}
                        data-testid="button-back-step-1"
                      >
                        Quay lại Chọn Bảng Giá
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
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
                                <p>Chọn cột chứa mô tả chi tiết</p>
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
                                <p>Chọn cột chứa giá</p>
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
                                <p>• Trích xuất từ giá: Tự động (vd: "49.000 đ/tháng" → "tháng")</p>
                                <p>• Thủ công: Nhập cố định cho tất cả</p>
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
                              <SelectItem value="extract">Trích xuất từ giá</SelectItem>
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
                                <p>Chọn cột chứa danh mục dịch vụ</p>
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

                      <Card>
                        <CardHeader>
                          <CardTitle>Xem trước Dữ liệu</CardTitle>
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
                          data-testid="button-cancel-mapping"
                        >
                          Hủy
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadData(null);
                            setSelectedFile(null);
                            setColumnMapping({});
                            setManualUnit("");
                            setImportStep("select-price-list");
                          }}
                          data-testid="button-back-step-1"
                        >
                          Quay lại Bước 1
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Price List Dialog */}
      <Dialog open={priceListDialogOpen} onOpenChange={setPriceListDialogOpen}>
        <DialogContent data-testid="dialog-price-list">
          <DialogHeader>
            <DialogTitle>
              {editingPriceList ? "Sửa Bảng Giá" : "Tạo Bảng Giá Mới"}
            </DialogTitle>
            <DialogDescription>
              {editingPriceList ? "Cập nhật thông tin bảng giá" : "Tạo bảng giá mới cho danh mục dịch vụ"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price-list-name">Tên *</Label>
              <Input
                id="price-list-name"
                placeholder="Nhập tên bảng giá"
                value={priceListForm.name}
                onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
                data-testid="input-price-list-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-list-description">Mô tả</Label>
              <Textarea
                id="price-list-description"
                placeholder="Nhập mô tả (tùy chọn)"
                value={priceListForm.description}
                onChange={(e) => setPriceListForm({ ...priceListForm, description: e.target.value })}
                data-testid="input-price-list-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPriceListDialogOpen(false)}
              data-testid="button-cancel-price-list"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSavePriceList}
              disabled={createPriceListMutation.isPending || updatePriceListMutation.isPending}
              data-testid="button-save-price-list"
            >
              {createPriceListMutation.isPending || updatePriceListMutation.isPending 
                ? "Đang lưu..." 
                : editingPriceList ? "Cập nhật" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
