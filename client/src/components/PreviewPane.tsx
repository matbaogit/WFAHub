import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useMemo } from "react";

interface PreviewPaneProps {
  htmlContent: string;
  sampleData: Record<string, string>;
  title?: string;
}

export default function PreviewPane({ 
  htmlContent, 
  sampleData, 
  title = "Xem trước" 
}: PreviewPaneProps) {
  
  const mergedHtml = useMemo(() => {
    if (!htmlContent) return "";
    
    let result = htmlContent;
    
    // Replace all {variable} with actual sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(pattern, value || `{${key}}`);
    });
    
    return result;
  }, [htmlContent, sampleData]);

  const isEmpty = !htmlContent || htmlContent.trim() === '' || htmlContent === '<p></p>';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {title}
        </CardTitle>
        {!isEmpty && (
          <p className="text-xs text-muted-foreground">
            Dữ liệu mẫu: {Object.entries(sampleData).map(([k, v]) => `${k}: ${v}`).slice(0, 2).join(', ')}
            {Object.keys(sampleData).length > 2 && '...'}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground border border-dashed rounded-md">
            Nhập nội dung vào editor để xem trước
          </div>
        ) : (
          <div 
            className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/30 min-h-40 max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: mergedHtml }}
            data-testid="preview-content"
          />
        )}
      </CardContent>
    </Card>
  );
}
