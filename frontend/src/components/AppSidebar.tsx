import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";
import { logoutUser } from "@/api/endpoints/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const mainItems = [
    { title: t('nav.dashboard'), url: "/", icon: LayoutDashboard },
    { title: t('nav.clients'), url: "/clients", icon: Users },
    { title: t('nav.services'), url: "/services", icon: Wrench },
    { title: t('nav.quotes'), url: "/quotes", icon: FileText },
    { title: t('nav.invoices'), url: "/invoices", icon: Receipt },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the API call fails, we still logout locally
    }
    logout();
    toast.success(i18next.t('toast.loggedOut'));
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`px-4 py-6 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-lg tracking-tight">
                InvoiceApp
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/80"
                      activeClassName="bg-accent text-foreground font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-4 py-2 text-xs text-muted-foreground truncate">
            {user.nombreComercial}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="hover:bg-accent/80"
                activeClassName="bg-accent text-foreground font-semibold"
              >
                <Settings className="mr-2 h-4 w-4" />
                {!collapsed && <span>{t('nav.settings')}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="hover:bg-accent/80 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>{t('nav.logout')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
