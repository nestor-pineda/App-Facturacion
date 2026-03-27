import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AgentWidget } from "@/features/agent/components/AgentWidget";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Analytics } from "@vercel/analytics/react";

const DEFAULT_USER_INITIALS = "US";
const COMMERCIAL_NAME_CAMEL_KEY = "nombreComercial";
const COMMERCIAL_NAME_SNAKE_KEY = "nombre_comercial";

const getUserInitials = (name?: string): string => {
  if (!name) {
    return DEFAULT_USER_INITIALS;
  }

  const compactName = name.trim();
  if (!compactName) {
    return DEFAULT_USER_INITIALS;
  }

  return compactName.slice(0, 2).toUpperCase();
};

const getCommercialName = (user: unknown): string | undefined => {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const userRecord = user as Record<string, unknown>;
  const camelCaseName = userRecord[COMMERCIAL_NAME_CAMEL_KEY];
  if (typeof camelCaseName === "string") {
    return camelCaseName;
  }

  const snakeCaseName = userRecord[COMMERCIAL_NAME_SNAKE_KEY];
  if (typeof snakeCaseName === "string") {
    return snakeCaseName;
  }

  return undefined;
};

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userInitials = getUserInitials(getCommercialName(user));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <button
              type="button"
              aria-label="Ir a Ajustes"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-black text-white text-xs font-semibold tracking-wide dark:bg-white dark:text-black"
              onClick={() => navigate("/settings")}
            >
              {userInitials}
            </button>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <AgentWidget />
      <Analytics />
    </SidebarProvider>
  );
}
