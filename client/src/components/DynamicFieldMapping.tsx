import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

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
  
  const handleAddField = () => {
    onMappingsChange([
      ...mappings,
      { fieldName: '', columnName: '' }
    ]);
  };

  const handleRemoveField = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onMappingsChange(newMappings);
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
            {mappings.map((mapping, index) => {
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
                        onClick={() => handleRemoveField(index)}
                        data-testid={`button-remove-field-${index}`}
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
