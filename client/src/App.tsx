import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ViewModeProvider, useViewMode } from "@/contexts/ViewModeContext";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Templates from "@/pages/templates";
import Logs from "@/pages/logs";
import Account from "@/pages/account";
import Customers from "@/pages/customers";
import Quotations from "@/pages/quotations";
import EmailTemplates from "@/pages/email-templates";
import SmtpConfig from "@/pages/smtp-config";
import Analytics from "@/pages/analytics";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminTemplates from "@/pages/admin/templates";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Conditional routes based on auth */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/templates" component={Templates} />
          <Route path="/customers" component={Customers} />
          <Route path="/quotations" component={Quotations} />
          <Route path="/email-templates" component={EmailTemplates} />
          <Route path="/smtp-config" component={SmtpConfig} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/logs" component={Logs} />
          <Route path="/account" component={Account} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/templates" component={AdminTemplates} />
          <Route path="/admin/stats" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { viewMode, toggleViewMode } = useViewMode();
  const [location] = useLocation();
  
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const isAdmin = user?.role === "admin";
  
  // Routes that should not show sidebar/topbar
  const isAuthRoute = location === "/login" || location === "/register";
  const shouldShowLayout = !isLoading && isAuthenticated && !isAuthRoute;

  if (!shouldShowLayout) {
    return (
      <>
        <Toaster />
        <Router />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleViewMode}
                  className="gap-2"
                  data-testid="button-toggle-view"
                >
                  {viewMode === "admin" ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Chế độ Người dùng
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Chế độ Admin
                    </>
                  )}
                </Button>
              )}
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ViewModeProvider>
          <AppContent />
        </ViewModeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
