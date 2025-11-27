import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PolicyPage } from "@shared/schema";

export default function Policy() {
  const [match, params] = useRoute("/policy/:slug");
  const slug = params?.slug || "";

  const { data: page, isLoading, error } = useQuery<PolicyPage>({
    queryKey: ["/api/policies", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
        </main>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-semibold mb-2" data-testid="text-not-found">Không tìm thấy trang</h1>
                <p className="text-muted-foreground mb-6">
                  Trang bạn yêu cầu không tồn tại hoặc đã bị xóa.
                </p>
                <Link href="/">
                  <Button data-testid="button-go-home">Quay về trang chủ</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium" data-testid="text-page-title">{page.title}</span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6" data-testid="text-main-title">{page.title}</h1>
        
        <Card>
          <CardContent className="pt-6">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
              data-testid="content-policy"
            />
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Cập nhật lần cuối: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
          </p>
        </div>
      </main>
      
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WFA Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
