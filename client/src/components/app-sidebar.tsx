import { useState } from "react";
import { Home, Zap, History, User, LogOut, Wallet, Sparkles, Shield, Users, BarChart3, FileText, UserCheck, Mail, Server, Layout, Package, SendHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Menu items before quotation group
const topMenuItems = [
  {
    title: "Trang chủ",
    url: "/",
    icon: Home,
  },
  {
    title: "Tính năng",
    url: "/templates",
    icon: Zap,
  },
];

// Quotation group submenu items
const quotationMenuItems = [
  {
    title: "Báo giá Đơn lẻ",
    url: "/quotations",
    icon: FileText,
  },
  {
    title: "Chiến dịch Email",
    url: "/bulk-campaigns",
    icon: SendHorizontal,
  },
  {
    title: "Mẫu Báo Giá",
    url: "/quotation-templates",
    icon: Layout,
  },
  {
    title: "Mẫu Email",
    url: "/email-templates",
    icon: Mail,
  },
  {
    title: "Cấu hình SMTP",
    url: "/smtp-config",
    icon: Server,
  },
];

// Menu items after quotation group
const bottomMenuItems = [
  {
    title: "Danh Mục Dịch Vụ",
    url: "/service-catalog",
    icon: Package,
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: UserCheck,
  },
  {
    title: "Phân tích",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Lịch sử",
    url: "/logs",
    icon: History,
  },
  {
    title: "Tài khoản",
    url: "/account",
    icon: User,
  },
];

const adminMenuItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Quản lý Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Quản lý Templates",
    url: "/admin/templates",
    icon: Zap,
  },
  {
    title: "Thống kê",
    url: "/admin/stats",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();
  
  // Check if any quotation submenu item is active
  const isQuotationGroupActive = quotationMenuItems.some(item => location === item.url || location.startsWith(item.url + '/'));
  
  // Default to open if any submenu is active
  const [isQuotationOpen, setIsQuotationOpen] = useState(isQuotationGroupActive);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Đã đăng xuất",
        description: "Hẹn gặp lại bạn!",
      });
    },
  });

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-bold px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              WFA Hub
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu>
              {/* Top menu items */}
              {topMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.url === '/' ? 'home' : item.url.slice(1)}`}
                    className={`
                      group relative mb-1 rounded-xl transition-all duration-200
                      ${location === item.url 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-blue-600 shadow-sm border-l-4 border-blue-600' 
                        : 'hover:bg-slate-100/80 hover:scale-[1.02]'
                      }
                    `}
                  >
                    <Link href={item.url}>
                      <item.icon className={`w-5 h-5 ${location === item.url ? 'text-blue-600' : 'text-slate-600'} transition-colors`} />
                      <span className={`font-medium ${location === item.url ? 'text-blue-600' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Collapsible Quotation Group */}
              <Collapsible open={isQuotationOpen} onOpenChange={setIsQuotationOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="link-quotation-group"
                      className={`
                        group relative mb-1 rounded-xl transition-all duration-200
                        ${isQuotationGroupActive
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-blue-600 shadow-sm border-l-4 border-blue-600' 
                          : 'hover:bg-slate-100/80 hover:scale-[1.02]'
                        }
                      `}
                    >
                      <Mail className={`w-5 h-5 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'} transition-colors`} />
                      <span className={`font-medium ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-700'}`}>
                        Gửi Báo Giá
                      </span>
                      {isQuotationOpen ? (
                        <ChevronDown className={`ml-auto w-4 h-4 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'}`} />
                      ) : (
                        <ChevronRight className={`ml-auto w-4 h-4 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'}`} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <SidebarMenu className="ml-4 border-l-2 border-slate-200/60 pl-2">
                      {quotationMenuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild
                            isActive={location === item.url || location.startsWith(item.url + '/')}
                            data-testid={`link-${item.url.slice(1)}`}
                            className={`
                              group relative mb-1 rounded-lg transition-all duration-200
                              ${location === item.url || location.startsWith(item.url + '/')
                                ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-blue-600 shadow-sm border-l-4 border-blue-600' 
                                : 'hover:bg-slate-100/80 hover:scale-[1.02]'
                              }
                            `}
                          >
                            <Link href={item.url}>
                              <item.icon className={`w-4 h-4 ${location === item.url || location.startsWith(item.url + '/') ? 'text-blue-600' : 'text-slate-600'} transition-colors`} />
                              <span className={`font-medium text-sm ${location === item.url || location.startsWith(item.url + '/') ? 'text-blue-600' : 'text-slate-700'}`}>
                                {item.title}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Bottom menu items */}
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.url.slice(1)}`}
                    className={`
                      group relative mb-1 rounded-xl transition-all duration-200
                      ${location === item.url 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-blue-600 shadow-sm border-l-4 border-blue-600' 
                        : 'hover:bg-slate-100/80 hover:scale-[1.02]'
                      }
                    `}
                  >
                    <Link href={item.url}>
                      <item.icon className={`w-5 h-5 ${location === item.url ? 'text-blue-600' : 'text-slate-600'} transition-colors`} />
                      <span className={`font-medium ${location === item.url ? 'text-blue-600' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && viewMode === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-orange-600 px-4 font-bold flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-admin-${item.url.split('/').pop()}`}
                      className={`
                        group relative mb-1 rounded-xl transition-all duration-200
                        ${location === item.url 
                          ? 'bg-gradient-to-r from-orange-500/10 to-red-600/10 text-orange-600 shadow-sm border-l-4 border-orange-600' 
                          : 'hover:bg-orange-50/80 hover:scale-[1.02]'
                        }
                      `}
                    >
                      <Link href={item.url}>
                        <item.icon className={`w-5 h-5 ${location === item.url ? 'text-orange-600' : 'text-slate-600'} transition-colors`} />
                        <span className={`font-medium ${location === item.url ? 'text-orange-600' : 'text-slate-700'}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-slate-500 px-4 font-semibold">
              Số dư
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <div className="py-2">
                <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-[2px] shadow-xl shadow-blue-500/30">
                  <div className="bg-white rounded-[14px] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-credits">
                              {user.credits}
                            </span>
                            <Sparkles className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">tín dụng</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/60 bg-slate-50/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-blue-500/20">
                    <AvatarImage src={user?.profileImageUrl || undefined} style={{ objectFit: 'cover' }} />
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout-sidebar"
                className="flex-shrink-0 hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
