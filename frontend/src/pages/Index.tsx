import { FileText, Receipt, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useQuotes } from "@/hooks/useQuotes";
import { useClients } from "@/hooks/useClients";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency } from "@/lib/calculations";
import { ESTADO_BORRADOR, ESTADO_ENVIADA, ESTADO_ENVIADO } from "@/lib/constants";
import type { EstadoDocument } from "@/types/enums";
import { useTranslation } from "react-i18next";

type FilterType = "all" | "quote" | "invoice";

interface RecentItem {
  id: string;
  type: "quote" | "invoice";
  number: string;
  clientName: string;
  total: number;
  status: EstadoDocument;
  date: string;
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: quotes, isLoading: loadingQuotes } = useQuotes();
  const { data: clients } = useClients();

  if (loadingInvoices || loadingQuotes) return <LoadingSpinner />;

  const totalInvoices = invoices?.length ?? 0;
  const totalQuotes = quotes?.length ?? 0;
  const totalClients = clients?.length ?? 0;
  const invoicesDraft = invoices?.filter((i) => i.estado === ESTADO_BORRADOR).length ?? 0;
  const invoicesSent = invoices?.filter((i) => i.estado === ESTADO_ENVIADA).length ?? 0;
  const totalRevenue = invoices?.filter((i) => i.estado === ESTADO_ENVIADA).reduce((acc, i) => acc + i.total, 0) ?? 0;

  const recentItems: RecentItem[] = [
    ...(invoices ?? []).map((inv) => ({
      id: inv.id,
      type: 'invoice' as const,
      number: inv.numero ?? t('common.draft'),
      clientName: inv.client.nombre,
      total: inv.total,
      status: inv.estado as EstadoDocument,
      date: inv.fechaEmision,
    })),
    ...(quotes ?? []).map((q) => ({
      id: q.id,
      type: 'quote' as const,
      number: q.numero ?? t('common.draft'),
      clientName: q.client.nombre,
      total: q.total,
      status: q.estado as EstadoDocument,
      date: q.fecha,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const filtered = recentItems.filter((item) => {
    const matchesType = filter === "all" || item.type === filter;
    const matchesSearch =
      item.number.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const actions = [
    { label: t('dashboard.actions.newQuote'), icon: FileText, path: "/quotes/new", description: t('dashboard.actions.newQuoteDesc') },
    { label: t('dashboard.actions.newInvoice'), icon: Receipt, path: "/invoices/new", description: t('dashboard.actions.newInvoiceDesc') },
    { label: t('dashboard.actions.newClient'), icon: Users, path: "/clients", description: t('dashboard.actions.newClientDesc') },
  ];

  const filterOptions = [
    { value: "all" as FilterType, label: t('dashboard.filterAll') },
    { value: "quote" as FilterType, label: t('dashboard.filterQuotes') },
    { value: "invoice" as FilterType, label: t('dashboard.filterInvoices') },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{t('dashboard.invoices')}</p>
          <p className="text-2xl font-bold">{totalInvoices}</p>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.draftCount', { count: invoicesDraft })} · {t('dashboard.sentCount', { count: invoicesSent })}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{t('dashboard.quotes')}</p>
          <p className="text-2xl font-bold">{totalQuotes}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{t('dashboard.clients')}</p>
          <p className="text-2xl font-bold">{totalClients}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{t('dashboard.revenue')}</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="action-card text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <action.icon className="h-6 w-6 text-foreground" />
            </div>
            <span className="font-bold text-base">{action.label}</span>
            <span className="text-sm text-muted-foreground">{action.description}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('dashboard.recentActivity')}</h2>
        </div>

        <div className="filter-bar">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {filterOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.number')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.client')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.type')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.status')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.total')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('dashboard.table.date')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(`/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`)}
                  className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-sm font-medium">{item.number}</td>
                  <td className="px-5 py-4 text-sm">{item.clientName}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {item.type === 'invoice' ? t('dashboard.typeLabel.invoice') : t('dashboard.typeLabel.quote')}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-sm text-right font-mono font-medium">{formatCurrency(item.total)}</td>
                  <td className="px-5 py-4 text-sm text-right text-muted-foreground">{item.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    {t('dashboard.noActivity')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Index;
