import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";

export interface FieldMapping {
  fieldName: string;
  columnName: string;
}

interface DynamicFieldMappingProps {
  headers: string[];
  preview: Array<Record<string, any>>;
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
}

export default function DynamicFieldMapping({ 
  headers, 
  preview, 
  mappings, 
  onMappingsChange 
}: DynamicFieldMappingProps) {
  const [showAll, setShowAll] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  
  const handleAddField = () => {
    onMappingsChange([
      ...mappings,
      { fieldName: '', columnName: '' }
    ]);
  };

  const handleHideField = (index: number) => {
    setHiddenColumns(new Set([...Array.from(hiddenColumns), index]));
  };

  const handleRestoreField = (index: number) => {
    const newHidden = new Set(hiddenColumns);
    newHidden.delete(index);
    setHiddenColumns(newHidden);
  };

  const handleFieldNameChange = (index: number, fieldName: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], fieldName };
    onMappingsChange(newMappings);
  };

  const handleColumnChange = (index: number, columnName: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], columnName };
    onMappingsChange(newMappings);
  };

  const getPreviewData = (columnName: string) => {
    if (!columnName || columnName === "NONE") return null;
    return preview.slice(0, 1).map((row) => row[columnName] || '-');
  };

  // Filter visible mappings (not hidden)
  const visibleMappings = mappings.map((m, i) => ({ mapping: m, index: i }))
    .filter(({ index }) => !hiddenColumns.has(index));
  
  // Show only first 3 if not expanded
  const displayedMappings = showAll 
    ? visibleMappings 
    : visibleMappings.slice(0, 3);
  
  const hiddenCount = visibleMappings.length - displayedMappings.length;
  
  // Get list of hidden columns for restore dropdown
  const hiddenMappingsList = mappings
    .map((m, i) => ({ mapping: m, index: i }))
    .filter(({ index }) => hiddenColumns.has(index));

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Trường dữ liệu</TableHead>
              <TableHead className="w-64">Cột trong file</TableHead>
              <TableHead>Dữ liệu trong tệp</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedMappings.map(({ mapping, index }) => {
              const isEmail = mapping.fieldName.toLowerCase() === 'email';
              const previewData = getPreviewData(mapping.columnName);

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {isEmail ? (
                      <div className="flex items-center gap-2">
                        <span>Email</span>
                        <Badge variant="destructive" className="text-xs">
                          Bắt buộc
                        </Badge>
                      </div>
                    ) : (
                      <Input
                        value={mapping.fieldName}
                        onChange={(e) => handleFieldNameChange(index, e.target.value)}
                        placeholder="Nhập tên trường..."
                        className="bg-muted/30"
                        data-testid={`input-field-name-${index}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.columnName || "NONE"}
                      onValueChange={(value) => {
                        handleColumnChange(index, value === "NONE" ? "" : value);
                      }}
                    >
                      <SelectTrigger data-testid={`select-column-${index}`}>
                        <SelectValue placeholder="-- Chọn cột --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Bỏ qua --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {previewData ? (
                      <div className="flex flex-wrap gap-1">
                        {previewData.map((value, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                        {preview.length > 1 && (
                          <span className="text-xs text-muted-foreground">...</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!isEmail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHideField(index)}
                        data-testid={`button-hide-field-${index}`}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Show more/less button */}
      {hiddenCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          data-testid="button-toggle-show-all"
          className="w-full"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Thu gọn
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Xem thêm {hiddenCount} cột
            </>
          )}
        </Button>
      )}

      {/* Restore hidden columns dropdown */}
      {hiddenMappingsList.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cột đã ẩn:</span>
          <Select onValueChange={(value) => handleRestoreField(parseInt(value))}>
            <SelectTrigger className="w-64" data-testid="select-restore-column">
              <SelectValue placeholder="-- Chọn cột để hiển thị lại --" />
            </SelectTrigger>
            <SelectContent>
              {hiddenMappingsList.map(({ mapping, index }) => (
                <SelectItem key={index} value={index.toString()}>
                  {mapping.fieldName || `Cột ${index + 1}`} ({mapping.columnName || 'Chưa chọn'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddField}
        data-testid="button-add-field"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm trường dữ liệu
      </Button>

      {/* Preview table showing raw data */}
      <div>
        <h4 className="text-sm font-medium mb-2">Xem trước file (5 dòng đầu)</h4>
        <div className="border rounded-md max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row, idx) => (
                <TableRow key={idx}>
                  {headers.map((header) => (
                    <TableCell key={header} className="whitespace-nowrap">
                      {row[header] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
