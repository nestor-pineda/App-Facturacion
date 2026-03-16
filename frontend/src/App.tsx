import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { PublicRoute } from "@/features/auth/components/PublicRoute";
import Index from "@/features/dashboard/pages/Index";
import Clients from "@/features/clients/pages/Clients";
import Services from "@/features/services/pages/Services";
import Quotes from "@/features/quotes/pages/Quotes";
import QuoteCreate from "@/features/quotes/pages/QuoteCreate";
import QuoteDetail from "@/features/quotes/pages/QuoteDetail";
import QuoteEdit from "@/features/quotes/pages/QuoteEdit";
import Invoices from "@/features/invoices/pages/Invoices";
import InvoiceCreate from "@/features/invoices/pages/InvoiceCreate";
import InvoiceDetail from "@/features/invoices/pages/InvoiceDetail";
import InvoiceEdit from "@/features/invoices/pages/InvoiceEdit";
import Settings from "@/pages/Settings";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import NotFound from "@/pages/NotFound";
import { useThemeStore } from "@/store/themeStore";
import { useLayoutEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/services" element={<Services />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/quotes/new" element={<QuoteCreate />} />
              <Route path="/quotes/:id" element={<QuoteDetail />} />
              <Route path="/quotes/:id/edit" element={<QuoteEdit />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceCreate />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
