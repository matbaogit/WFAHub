import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useMemo } from "react";

interface PreviewPaneProps {
  htmlContent: string;
  sampleData: Record<string, string>;
  title?: string;
  subject?: string;
}

export default function PreviewPane({ 
  htmlContent, 
  sampleData, 
  title = "Xem trước",
  subject
}: PreviewPaneProps) {
  
  const mergedSubject = useMemo(() => {
    if (!subject) return "";
    
    let result = subject;
    
    // Replace all {variable} with actual sample data highlighted in blue
    Object.entries(sampleData).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      const highlightedValue = value 
        ? `<span style="color: #2094f3; font-weight: 500;">${value}</span>` 
        : `{${key}}`;
      result = result.replace(pattern, highlightedValue);
    });
    
    return result;
  }, [subject, sampleData]);

  const mergedHtml = useMemo(() => {
    if (!htmlContent) return "";
    
    let result = htmlContent;
    
    // Replace all {variable} with actual sample data highlighted in blue
    Object.entries(sampleData).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      const highlightedValue = value 
        ? `<span style="color: #2094f3; font-weight: 500;">${value}</span>` 
        : `{${key}}`;
      result = result.replace(pattern, highlightedValue);
    });
    
    return result;
  }, [htmlContent, sampleData]);

  const isEmpty = !htmlContent || htmlContent.trim() === '' || htmlContent === '<p></p>';

  return (
    <Card className="h-full flex flex-col max-h-[calc(100vh-8rem)]">
      <CardHeader className="pb-3 flex-shrink-0">
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
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {isEmpty ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground border border-dashed rounded-md">
            Nhập nội dung vào editor để xem trước
          </div>
        ) : (
          <div className="border rounded-md bg-muted/30 overflow-y-auto flex-1 flex flex-col">
            {subject && (
              <div className="border-b bg-background/50 px-4 py-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">Tiêu đề thư:</div>
                <div 
                  className="text-sm font-medium"
                  dangerouslySetInnerHTML={{ __html: mergedSubject }}
                  data-testid="preview-subject"
                />
              </div>
            )}
            <div 
              className="prose prose-sm max-w-none p-4 flex-1"
              dangerouslySetInnerHTML={{ __html: mergedHtml }}
              data-testid="preview-content"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
