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
import { Trash2, FileSpreadsheet, CheckCircle, HelpCircle, Search, X, Plus, Edit, ChevronRight, List } from "lucide-react";
import type { ServiceCatalog, PriceList } from "@shared/schema";

type ImportStep = "select-price-list" | "upload-and-map";

export default function ServiceCatalogPage() {
  const { toast } = useToast();
  
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
  
  // Catalog View State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceListFilter, setPriceListFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch Price Lists
  const { data: priceLists = [], isLoading: priceListsLoading } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  // Fetch Catalog
  const { data: catalog = [], isLoading: catalogLoading } = useQuery<ServiceCatalog[]>({
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
      const matchesPriceList = priceListFilter === "all" || item.priceListId === priceListFilter;
      return matchesSearch && matchesCategory && matchesPriceList;
    });
  }, [catalog, searchTerm, categoryFilter, priceListFilter]);

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
      toast({ title: "Success", description: "Price list created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      toast({ title: "Success", description: "Price list updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePriceListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: "Success", description: "Price list deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        title: "Import successful",
        description: `Imported ${data.imported} items`,
      });
      resetImportState();
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
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
          title: "Validation error",
          description: "Please enter a price list name",
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
          title: "Error",
          description: error.message || "Failed to create price list",
          variant: "destructive",
        });
      }
    } else {
      if (!selectedPriceListId) {
        toast({
          title: "Validation error",
          description: "Please select a price list",
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
        title: "Validation error",
        description: "Please enter a price list name",
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
          <h1 className="text-3xl font-bold" data-testid="text-catalog-title">Service Catalog</h1>
          <p className="text-muted-foreground">Manage price lists and import service catalog from Excel/CSV</p>
        </div>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="tabs-catalog-main">
          <TabsTrigger value="catalog" data-testid="tab-catalog">Catalog</TabsTrigger>
          <TabsTrigger value="price-lists" data-testid="tab-price-lists">Price Lists</TabsTrigger>
          <TabsTrigger value="import" data-testid="tab-import">Import Services</TabsTrigger>
        </TabsList>

        {/* Price Lists Management Tab */}
        <TabsContent value="price-lists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Price Lists</CardTitle>
                  <CardDescription>Create and manage your price lists</CardDescription>
                </div>
                <Button onClick={() => handleOpenPriceListDialog()} data-testid="button-create-price-list">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Price List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priceListsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : priceLists.length === 0 ? (
                <p className="text-sm text-muted-foreground">No price lists yet. Create one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {priceLists.map((priceList) => (
                    <Card key={priceList.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold" data-testid={`text-price-list-name-${priceList.id}`}>
                              {priceList.name}
                            </h3>
                            {priceList.description && (
                              <p className="text-sm text-muted-foreground">{priceList.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {catalog.filter(item => item.priceListId === priceList.id).length} services
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPriceListDialog(priceList)}
                              data-testid={`button-edit-price-list-${priceList.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure? This will delete all associated services.")) {
                                  deletePriceListMutation.mutate(priceList.id);
                                }
                              }}
                              data-testid={`button-delete-price-list-${priceList.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Import Services Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Multi-Step Import Workflow
                <Badge variant="outline" data-testid="text-current-step">
                  Step {importStep === "select-price-list" ? "1" : "2"} of 2
                </Badge>
              </CardTitle>
              <CardDescription>
                {importStep === "select-price-list" 
                  ? "Select an existing price list or create a new one"
                  : "Upload and map your CSV/Excel file"}
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
                      <h3 className="font-semibold">Select Price List</h3>
                      <p className="text-sm text-muted-foreground">Choose where to import services</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-muted-foreground">Upload & Map</h3>
                      <p className="text-sm text-muted-foreground">Configure column mapping</p>
                    </div>
                  </div>

                  <RadioGroup
                    value={createNewPriceList ? "new" : "existing"}
                    onValueChange={(v) => setCreateNewPriceList(v === "new")}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing" data-testid="radio-select-existing" />
                        <Label htmlFor="existing" className="font-semibold">Select Existing Price List</Label>
                      </div>

                      {!createNewPriceList && (
                        <div className="ml-6 space-y-2">
                          {priceListsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading price lists...</p>
                          ) : priceLists.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No price lists available. Create one first.</p>
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
                        <Label htmlFor="new" className="font-semibold">Create New Price List</Label>
                      </div>

                      {createNewPriceList && (
                        <div className="ml-6 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-price-list-name">Name *</Label>
                            <Input
                              id="new-price-list-name"
                              placeholder="Enter price list name"
                              value={newPriceListName}
                              onChange={(e) => setNewPriceListName(e.target.value)}
                              data-testid="input-new-price-list-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-price-list-description">Description</Label>
                            <Textarea
                              id="new-price-list-description"
                              placeholder="Enter description (optional)"
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
                    <Button onClick={handleProceedToMapping} data-testid="button-proceed-to-mapping">
                      Continue to Upload & Mapping
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
                      <h3 className="font-semibold text-muted-foreground">Select Price List</h3>
                      <p className="text-sm text-muted-foreground">
                        {getPriceListName(selectedPriceListId)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Upload & Map</h3>
                      <p className="text-sm text-muted-foreground">Configure column mapping</p>
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
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        File should contain columns: Service Name, Description, Unit Price, Unit, Category
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setImportStep("select-price-list")}
                        data-testid="button-back-to-step1"
                      >
                        Back to Price List Selection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Service Name (required) *</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select column containing service/product name</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={columnMapping.name?.toString()}
                            onValueChange={(v) => setColumnMapping({ ...columnMapping, name: parseInt(v) })}
                          >
                            <SelectTrigger data-testid="select-name-column">
                              <SelectValue placeholder="Select column..." />
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
                            <Label>Description</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select column containing detailed description</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={columnMapping.description?.toString()}
                            onValueChange={(v) => setColumnMapping({ ...columnMapping, description: parseInt(v) })}
                          >
                            <SelectTrigger data-testid="select-description-column">
                              <SelectValue placeholder="Select column..." />
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
                            <Label>Unit Price (required) *</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select column containing price</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={columnMapping.unitPrice?.toString()}
                            onValueChange={(v) => setColumnMapping({ ...columnMapping, unitPrice: parseInt(v) })}
                          >
                            <SelectTrigger data-testid="select-price-column">
                              <SelectValue placeholder="Select column..." />
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
                            <Label>Price Format</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Select number separator in file:</p>
                                <p>• Dot: 1.000.000 or 1000000</p>
                                <p>• Comma: 1,000,000</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <RadioGroup value={priceFormat} onValueChange={(v: "dot" | "comma") => setPriceFormat(v)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="dot" id="dot" data-testid="radio-price-dot" />
                              <Label htmlFor="dot">Dot (1.000.000)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="comma" id="comma" data-testid="radio-price-comma" />
                              <Label htmlFor="comma">Comma (1,000,000)</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Unit</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Select unit source:</p>
                                <p>• From column: Get from separate column</p>
                                <p>• Extract from price: Auto extract (e.g., "49.000 đ/month" → "month")</p>
                                <p>• Manual: Enter fixed unit for all</p>
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
                              <SelectValue placeholder="Select source..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual entry</SelectItem>
                              <SelectItem value="extract">Extract from price</SelectItem>
                              {uploadData.headers.map((header, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                  From column: {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {columnMapping.unit === "manual" && (
                            <Input
                              placeholder="Enter unit (e.g., hour, day, month, set...)"
                              value={manualUnit}
                              onChange={(e) => setManualUnit(e.target.value)}
                              data-testid="input-manual-unit"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Category</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select column containing service category</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={columnMapping.category?.toString()}
                            onValueChange={(v) => setColumnMapping({ ...columnMapping, category: parseInt(v) })}
                          >
                            <SelectTrigger data-testid="select-category-column">
                              <SelectValue placeholder="Select column..." />
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
                          <CardTitle>Preview Data</CardTitle>
                          <CardDescription>First 5 rows from your file</CardDescription>
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
                          {importMutation.isPending ? "Importing..." : "Import"}
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
                          Cancel
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
                          data-testid="button-back-to-step1-from-mapping"
                        >
                          Back to Step 1
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Service Catalog ({filteredCatalog.length})
                  </CardTitle>
                  <CardDescription>Browse and manage imported services</CardDescription>
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
                    Delete {selectedItems.size} items
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or description..."
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
                <Select value={priceListFilter} onValueChange={setPriceListFilter}>
                  <SelectTrigger className="w-[220px]" data-testid="select-price-list-filter">
                    <SelectValue placeholder="Filter by price list" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Price Lists</SelectItem>
                    {priceLists.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                    <SelectValue placeholder="Filter category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat || ""}>
                        {cat || "(No category)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {catalogLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {catalog.length === 0 
                    ? "No services yet. Import a file to get started."
                    : "No matching results found."}
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
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price List</TableHead>
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
                              data-testid={`checkbox-select-${item.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>
                            {item.name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" data-testid={`text-description-${item.id}`}>
                            {item.description || "-"}
                          </TableCell>
                          <TableCell data-testid={`text-price-${item.id}`}>
                            {item.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell data-testid={`text-unit-${item.id}`}>
                            {item.unit || "-"}
                          </TableCell>
                          <TableCell data-testid={`text-category-${item.id}`}>
                            {item.category || "-"}
                          </TableCell>
                          <TableCell data-testid={`text-price-list-${item.id}`}>
                            <Badge variant="outline">{getPriceListName(item.priceListId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
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
        </TabsContent>
      </Tabs>

      {/* Price List Dialog */}
      <Dialog open={priceListDialogOpen} onOpenChange={setPriceListDialogOpen}>
        <DialogContent data-testid="dialog-price-list">
          <DialogHeader>
            <DialogTitle>
              {editingPriceList ? "Edit Price List" : "Create Price List"}
            </DialogTitle>
            <DialogDescription>
              {editingPriceList ? "Update price list details" : "Create a new price list"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price-list-name">Name *</Label>
              <Input
                id="price-list-name"
                placeholder="Enter price list name"
                value={priceListForm.name}
                onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
                data-testid="input-price-list-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-list-description">Description</Label>
              <Textarea
                id="price-list-description"
                placeholder="Enter description (optional)"
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
              Cancel
            </Button>
            <Button
              onClick={handleSavePriceList}
              disabled={createPriceListMutation.isPending || updatePriceListMutation.isPending}
              data-testid="button-save-price-list"
            >
              {editingPriceList ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
