import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ColumnMappingTableProps {
  headers: string[];
  preview: Array<Record<string, any>>;
  mapping: Record<string, string>;
  onMappingChange: (field: string, column: string) => void;
}

const MAPPING_FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'name', label: 'Tên', required: false },
  { key: 'company', label: 'Công ty', required: false },
  { key: 'phone', label: 'Số điện thoại', required: false },
  { key: 'address', label: 'Địa chỉ', required: false },
];

export default function ColumnMappingTable({ 
  headers, 
  preview, 
  mapping, 
  onMappingChange 
}: ColumnMappingTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Trường dữ liệu</TableHead>
              <TableHead className="w-64">Cột trong file</TableHead>
              <TableHead>Xem trước dữ liệu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MAPPING_FIELDS.map((field) => (
              <TableRow key={field.key}>
                <TableCell className="font-medium">
                  {field.label}
                  {field.required && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Bắt buộc
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping[field.key] || ""}
                    onValueChange={(value) => onMappingChange(field.key, value)}
                  >
                    <SelectTrigger data-testid={`select-mapping-${field.key}`}>
                      <SelectValue placeholder="-- Chọn cột --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Bỏ qua --</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {mapping[field.key] && preview.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {preview.slice(0, 3).map((row, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {row[mapping[field.key]] || '-'}
                        </Badge>
                      ))}
                      {preview.length > 3 && (
                        <span className="text-xs text-muted-foreground">...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
