import { Button } from "@/components/ui/button";
import { Zap, Mail, FileText, Bell, CheckCircle, FileSignature, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">WFA Hub</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Đăng nhập
          </Button>
        </div>
      </header>

      <main>
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Tự động hóa quy trình doanh nghiệp</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Chạy tính năng tự động
              <br />
              <span className="text-primary">chỉ với một cú nhấp</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              WFA Hub cung cấp các mẫu tự động hóa sẵn sàng sử dụng. 
              Không cần lập trình, chỉ cần cấu hình và thực thi ngay lập tức.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="gap-2"
                data-testid="button-get-started"
              >
                Bắt đầu ngay
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Các tính năng sẵn có</h2>
              <p className="text-muted-foreground">
                Sử dụng ngay các mẫu tự động hóa được thiết kế sẵn
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Mail,
                  title: "Gửi Email kèm File",
                  description: "Tự động gửi email với tệp đính kèm đến nhiều người nhận"
                },
                {
                  icon: FileText,
                  title: "Gửi Báo Giá",
                  description: "Tạo và gửi báo giá chuyên nghiệp tự động"
                },
                {
                  icon: Bell,
                  title: "Đặt Lịch Nhắc",
                  description: "Thiết lập nhắc nhở tự động cho các sự kiện quan trọng"
                },
                {
                  icon: CheckCircle,
                  title: "Phê Duyệt Nghỉ Phép",
                  description: "Quy trình phê duyệt nghỉ phép tự động và nhanh chóng"
                },
                {
                  icon: FileSignature,
                  title: "Ký Hợp Đồng",
                  description: "Gửi và quản lý chữ ký điện tử hợp đồng"
                },
                {
                  icon: Zap,
                  title: "Và nhiều hơn nữa",
                  description: "Thêm các tính năng mới thường xuyên"
                }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-background rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Sẵn sàng tự động hóa quy trình?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Đăng nhập ngay để bắt đầu sử dụng các tính năng tự động hóa miễn phí
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="gap-2"
              data-testid="button-cta-login"
            >
              Đăng nhập ngay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 WFA Hub. Nền tảng tự động hóa quy trình doanh nghiệp.</p>
        </div>
      </footer>
    </div>
  );
}
