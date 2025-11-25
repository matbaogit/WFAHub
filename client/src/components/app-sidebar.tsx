import { useState } from "react";
import { Home, Zap, History, User, LogOut, Wallet, Sparkles, Shield, Users, BarChart3, FileText, UserCheck, Mail, Server, Layout, Package, SendHorizontal, ChevronDown, ChevronRight, Settings } from "lucide-react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminMenuPreferences } from "@/hooks/useAdminMenuPreferences";
import { AdminMenuSettings } from "@/components/AdminMenuSettings";
import { UserMenuSettings } from "@/components/UserMenuSettings";

// Menu items before quotation group
const topMenuItems = [
  {
    id: "home",
    title: "Trang chủ",
    url: "/",
    icon: Home,
  },
  {
    id: "templates",
    title: "Tính năng",
    url: "/templates",
    icon: Zap,
  },
];

// Quotation group submenu items
const quotationMenuItems = [
  {
    id: "bulk-campaigns",
    title: "Chiến dịch Gửi Email",
    url: "/bulk-campaigns",
    icon: SendHorizontal,
  },
  {
    id: "quotation-templates",
    title: "Mẫu tệp đính kèm",
    url: "/quotation-templates",
    icon: Layout,
  },
  {
    id: "email-templates",
    title: "Mẫu nội dung email",
    url: "/email-templates",
    icon: Mail,
  },
  {
    id: "smtp-config",
    title: "Cấu hình SMTP",
    url: "/smtp-config",
    icon: Server,
  },
];

// Menu items after quotation group
const bottomMenuItems = [
  {
    id: "service-catalog",
    title: "Danh Mục Dịch Vụ",
    url: "/service-catalog",
    icon: Package,
  },
  {
    id: "customers",
    title: "Khách hàng",
    url: "/customers",
    icon: UserCheck,
  },
  {
    id: "analytics",
    title: "Phân tích",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    id: "logs",
    title: "Lịch sử",
    url: "/logs",
    icon: History,
  },
  {
    id: "account",
    title: "Tài khoản",
    url: "/account",
    icon: User,
  },
];

const adminMenuItems = [
  {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    id: "admin-users",
    title: "Quản lý Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    id: "admin-templates",
    title: "Quản lý Templates",
    url: "/admin/templates",
    icon: Zap,
  },
  {
    id: "admin-smtp",
    title: "SMTP Hệ thống",
    url: "/admin/system-smtp",
    icon: Server,
  },
  {
    id: "admin-stats",
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
  const { isMenuVisible } = useAdminMenuPreferences();
  const [isUserMenuSettingsOpen, setIsUserMenuSettingsOpen] = useState(false);
  
  // Fetch user menu visibility settings (available for all authenticated users)
  const { data: menuVisibilityData } = useQuery<{ userMenuVisibility: Record<string, boolean> }>({
    queryKey: ['/api/user-menu-visibility'],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  const userMenuVisibility: Record<string, boolean> = menuVisibilityData?.userMenuVisibility || {};
  
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
  
  // Helper function to check if menu item should be visible in user view
  const isMenuItemVisible = (menuId: string) => {
    // In admin view, show all menus
    if (viewMode === 'admin') return true;
    // In user view, check system settings
    return userMenuVisibility[menuId] !== false;
  };
  
  // Filter menu items based on visibility settings
  const visibleTopMenuItems = topMenuItems.filter(item => isMenuItemVisible(item.id));
  const visibleQuotationMenuItems = quotationMenuItems.filter(item => isMenuItemVisible(item.id));
  const visibleBottomMenuItems = bottomMenuItems.filter(item => isMenuItemVisible(item.id));

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
              {visibleTopMenuItems.map((item) => (
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
                  <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location === '/bulk-campaigns' || location.startsWith('/bulk-campaigns/')}
                      data-testid="link-quotation-group"
                      className={`
                        group relative mb-1 rounded-xl transition-all duration-200 flex-1
                        ${location === '/bulk-campaigns' || location.startsWith('/bulk-campaigns/')
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-blue-600 shadow-sm border-l-4 border-blue-600' 
                          : 'hover:bg-slate-100/80 hover:scale-[1.02]'
                        }
                      `}
                    >
                      <Link href="/bulk-campaigns">
                        <Mail className={`w-5 h-5 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'} transition-colors`} />
                        <span className={`font-medium ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-700'}`}>
                          Chiến dịch Gửi Email
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mb-1 px-2 hover:bg-slate-100/80 rounded-lg"
                        data-testid="button-toggle-quotation-group"
                      >
                        {isQuotationOpen ? (
                          <ChevronDown className={`w-4 h-4 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'}`} />
                        ) : (
                          <ChevronRight className={`w-4 h-4 ${isQuotationGroupActive ? 'text-blue-600' : 'text-slate-600'}`} />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-1">
                    <SidebarMenu className="ml-4 border-l-2 border-slate-200/60 pl-2">
                      {visibleQuotationMenuItems.map((item) => (
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
              {visibleBottomMenuItems.map((item) => (
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
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-orange-600 px-4 font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUserMenuSettingsOpen(true)}
                className="h-5 w-5 hover:bg-orange-100 rounded-md"
                title="Cài đặt menu người dùng"
                data-testid="button-user-menu-settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <SidebarMenu>
                {adminMenuItems.filter(item => isMenuVisible(item.id)).map((item) => (
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

      <UserMenuSettings
        open={isUserMenuSettingsOpen}
        onOpenChange={setIsUserMenuSettingsOpen}
      />
    </Sidebar>
  );
}
