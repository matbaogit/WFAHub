import { Button } from "@/components/ui/button";
import { Zap, Mail, FileText, Bell, CheckCircle, FileSignature, ArrowRight, Sparkles, User, Users, Send, Clock, Shield, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function CountUpNumber({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FloatingShape({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

function GlowOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden">
      <header className="border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 relative">
              <Zap className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 animate-pulse opacity-50 blur-sm" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              WFA Hub
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-go-dashboard"
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  {user.username}
                </Button>
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-dashboard"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
                >
                  Vào Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/register')}
                  data-testid="button-register"
                  className="border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
                >
                  Đăng ký
                </Button>
                <Button 
                  onClick={() => setLocation('/login')}
                  data-testid="button-login"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
                >
                  Đăng nhập
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      <main>
        {/* Hero Section with Animated Background */}
        <section className="py-28 px-8 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Gradient Orbs */}
            <GlowOrb 
              className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-cyan-400/30 to-blue-500/20 rounded-full blur-3xl"
              delay={0}
            />
            <GlowOrb 
              className="absolute bottom-20 right-[10%] w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"
              delay={2}
            />
            <GlowOrb 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full blur-3xl"
              delay={1}
            />
            
            {/* Floating Shapes */}
            <FloatingShape 
              className="absolute top-32 right-[20%] w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl rotate-12"
              delay={0}
            />
            <FloatingShape 
              className="absolute bottom-32 left-[15%] w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full"
              delay={1}
            />
            <FloatingShape 
              className="absolute top-48 left-[25%] w-8 h-8 bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-lg rotate-45"
              delay={2}
            />
            <FloatingShape 
              className="absolute bottom-48 right-[25%] w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl -rotate-12"
              delay={1.5}
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-blue-600 text-sm font-semibold mb-8 shadow-sm backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>Tự động hóa quy trình doanh nghiệp</span>
            </motion.div>
            
            <motion.h1 
              className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Chạy tính năng tự động
              <br />
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                chỉ với một cú nhấp
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              WFA Hub cung cấp các mẫu tự động hóa sẵn sàng sử dụng. 
              Không cần lập trình, chỉ cần cấu hình và thực thi ngay lập tức.
            </motion.p>
            
            <motion.div 
              className="flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button 
                size="lg" 
                onClick={() => setLocation('/register')}
                className="group gap-2 h-14 px-10 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 relative overflow-hidden"
                data-testid="button-get-started"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Bắt đầu ngay
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-14 px-8 text-base border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
                data-testid="button-learn-more"
              >
                Tìm hiểu thêm
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-8 bg-white/70 backdrop-blur-sm border-y border-slate-200/50">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {[
                { number: 500, suffix: "+", label: "Người dùng", icon: Users },
                { number: 10000, suffix: "+", label: "Email đã gửi", icon: Send },
                { number: 99, suffix: "%", label: "Thời gian hoạt động", icon: Clock },
                { number: 100, suffix: "%", label: "Bảo mật dữ liệu", icon: Shield },
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    <CountUpNumber end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works - 3 Steps Section */}
        <section className="py-24 px-8 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Bắt đầu chỉ trong 3 bước
              </h2>
              <p className="text-lg text-slate-600">
                Đơn giản, nhanh chóng và hiệu quả
              </p>
            </motion.div>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 -translate-y-1/2 z-0 opacity-20" />
              
              <motion.div 
                className="grid md:grid-cols-3 gap-8 relative z-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {[
                  {
                    step: "01",
                    title: "Đăng ký tài khoản",
                    description: "Tạo tài khoản miễn phí chỉ trong vài giây với email của bạn",
                    gradient: "from-cyan-500 to-cyan-600"
                  },
                  {
                    step: "02",
                    title: "Chọn & Cấu hình",
                    description: "Chọn mẫu tự động hóa phù hợp và tùy chỉnh theo nhu cầu",
                    gradient: "from-blue-500 to-blue-600"
                  },
                  {
                    step: "03",
                    title: "Thực thi tự động",
                    description: "Nhấn nút và để hệ thống tự động hoàn thành công việc cho bạn",
                    gradient: "from-indigo-500 to-indigo-600"
                  }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    variants={scaleIn}
                    className="relative bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200/60 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  >
                    {/* Step Number */}
                    <div className={`absolute -top-4 left-8 w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {item.step}
                    </div>
                    
                    {/* Arrow to next step */}
                    {idx < 2 && (
                      <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                          <ChevronRight className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Các tính năng sẵn có
              </h2>
              <p className="text-lg text-slate-600">
                Sử dụng ngay các mẫu tự động hóa được thiết kế sẵn
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                {
                  icon: Mail,
                  title: "Gửi Email kèm File",
                  description: "Tự động gửi email với tệp đính kèm đến nhiều người nhận",
                  gradient: "from-purple-500 to-pink-500",
                  glowColor: "purple"
                },
                {
                  icon: FileText,
                  title: "Gửi Báo Giá",
                  description: "Tạo và gửi báo giá chuyên nghiệp tự động",
                  gradient: "from-cyan-500 to-blue-600",
                  glowColor: "cyan"
                },
                {
                  icon: Bell,
                  title: "Đặt Lịch Nhắc",
                  description: "Thiết lập nhắc nhở tự động cho các sự kiện quan trọng",
                  gradient: "from-orange-500 to-red-500",
                  glowColor: "orange"
                },
                {
                  icon: CheckCircle,
                  title: "Phê Duyệt Nghỉ Phép",
                  description: "Quy trình phê duyệt nghỉ phép tự động và nhanh chóng",
                  gradient: "from-green-500 to-emerald-600",
                  glowColor: "green"
                },
                {
                  icon: FileSignature,
                  title: "Ký Hợp Đồng",
                  description: "Gửi và quản lý chữ ký điện tử hợp đồng",
                  gradient: "from-violet-500 to-purple-600",
                  glowColor: "violet"
                },
                {
                  icon: Zap,
                  title: "Và nhiều hơn nữa",
                  description: "Thêm các tính năng mới thường xuyên",
                  gradient: "from-amber-500 to-orange-500",
                  glowColor: "amber"
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={scaleIn}
                  className="group relative bg-white rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Border on Hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[2px]`}>
                    <div className="absolute inset-[2px] bg-white rounded-[22px]" />
                  </div>
                  
                  {/* Glow Effect */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 px-8 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700" />
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <GlowOrb 
              className="absolute top-10 left-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"
              delay={0}
            />
            <GlowOrb 
              className="absolute bottom-10 right-[10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"
              delay={1.5}
            />
            <FloatingShape 
              className="absolute top-20 right-[20%] w-12 h-12 bg-white/10 rounded-xl rotate-12"
              delay={0.5}
            />
            <FloatingShape 
              className="absolute bottom-20 left-[20%] w-8 h-8 bg-white/10 rounded-full"
              delay={1}
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          
          <motion.div 
            className="max-w-4xl mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-12 h-12 text-white/80" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
            >
              Sẵn sàng tự động hóa quy trình?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-white/80 mb-10 leading-relaxed"
            >
              Đăng nhập ngay để bắt đầu sử dụng các tính năng tự động hóa miễn phí
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button 
                size="lg" 
                onClick={() => setLocation('/login')}
                className="group gap-2 h-14 px-10 text-base bg-white text-blue-600 hover:bg-white/90 shadow-2xl shadow-black/20 hover:shadow-black/30 hover:scale-105 transition-all duration-300"
                data-testid="button-cta-login"
              >
                <span className="flex items-center gap-2">
                  Đăng nhập ngay
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 py-12 px-8 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">WFA Hub</span>
            </motion.div>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <a 
                href="/policy/dieu-khoan-su-dung" 
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                data-testid="link-terms"
              >
                Điều khoản sử dụng
              </a>
              <a 
                href="/policy/chinh-sach-bao-mat" 
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                data-testid="link-privacy"
              >
                Chính sách bảo mật
              </a>
              <a 
                href="/policy/lien-he" 
                className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                data-testid="link-contact"
              >
                Liên hệ
              </a>
            </nav>
          </div>
          <div className="text-center pt-6 border-t border-slate-200/60">
            <p className="text-sm text-slate-500">© 2025 WFA Hub. Nền tảng tự động hóa quy trình doanh nghiệp.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
