import { Button } from "@/components/ui/button";
import { Zap, Mail, FileText, Bell, CheckCircle, FileSignature, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              WFA Hub
            </span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
          >
            Đăng nhập
          </Button>
        </div>
      </header>

      <main>
        <section className="py-28 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-blue-600 text-sm font-semibold mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>Tự động hóa quy trình doanh nghiệp</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Chạy tính năng tự động
              <br />
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                chỉ với một cú nhấp
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              WFA Hub cung cấp các mẫu tự động hóa sẵn sàng sử dụng. 
              Không cần lập trình, chỉ cần cấu hình và thực thi ngay lập tức.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="gap-2 h-14 px-10 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
                data-testid="button-get-started"
              >
                Bắt đầu ngay
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Các tính năng sẵn có
              </h2>
              <p className="text-lg text-slate-600">
                Sử dụng ngay các mẫu tự động hóa được thiết kế sẵn
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Mail,
                  title: "Gửi Email kèm File",
                  description: "Tự động gửi email với tệp đính kèm đến nhiều người nhận",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: FileText,
                  title: "Gửi Báo Giá",
                  description: "Tạo và gửi báo giá chuyên nghiệp tự động",
                  gradient: "from-cyan-500 to-blue-600"
                },
                {
                  icon: Bell,
                  title: "Đặt Lịch Nhắc",
                  description: "Thiết lập nhắc nhở tự động cho các sự kiện quan trọng",
                  gradient: "from-orange-500 to-red-500"
                },
                {
                  icon: CheckCircle,
                  title: "Phê Duyệt Nghỉ Phép",
                  description: "Quy trình phê duyệt nghỉ phép tự động và nhanh chóng",
                  gradient: "from-green-500 to-emerald-600"
                },
                {
                  icon: FileSignature,
                  title: "Ký Hợp Đồng",
                  description: "Gửi và quản lý chữ ký điện tử hợp đồng",
                  gradient: "from-violet-500 to-purple-600"
                },
                {
                  icon: Zap,
                  title: "Và nhiều hơn nữa",
                  description: "Thêm các tính năng mới thường xuyên",
                  gradient: "from-amber-500 to-orange-500"
                }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group bg-white rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-2 transition-all duration-300"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-28 px-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Sẵn sàng tự động hóa quy trình?
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Đăng nhập ngay để bắt đầu sử dụng các tính năng tự động hóa miễn phí
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="gap-2 h-14 px-10 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
              data-testid="button-cta-login"
            >
              Đăng nhập ngay
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 py-12 px-8 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">WFA Hub</span>
          </div>
          <p className="text-sm text-slate-500">© 2025 WFA Hub. Nền tảng tự động hóa quy trình doanh nghiệp.</p>
        </div>
      </footer>
    </div>
  );
}
