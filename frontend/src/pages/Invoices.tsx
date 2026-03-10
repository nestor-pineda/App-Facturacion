import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency } from "@/lib/calculations";
import { ESTADO_BORRADOR, ESTADO_ENVIADA } from "@/lib/constants";
import type { EstadoInvoice } from "@/types/enums";
import { useTranslation } from "react-i18next";

const STATUS_FILTER_ALL = 'all' as const;
type StatusFilter = typeof STATUS_FILTER_ALL | EstadoInvoice;

const Invoices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER_ALL);

  const { data: invoices, isLoading } = useInvoices();

  const filtered = (invoices ?? []).filter((inv) => {
    const matchesSearch =
      (inv.numero ?? '').toLowerCase().includes(search.toLowerCase()) ||
      inv.client.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === STATUS_FILTER_ALL || inv.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: STATUS_FILTER_ALL, label: t('invoices.filterAll') },
    { value: ESTADO_BORRADOR, label: t('invoices.filterDraft') },
    { value: ESTADO_ENVIADA, label: t('invoices.filterSent') },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t('invoices.title')}</h1>
          <p className="page-subtitle">{t('invoices.subtitle', { count: invoices?.length ?? 0 })}</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('invoices.newButton')}
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('invoices.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('invoices.table.number')}</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('invoices.table.client')}</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('invoices.table.status')}</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('invoices.table.total')}</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('invoices.table.date')}</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 font-mono text-sm font-medium">{inv.numero ?? '—'}</td>
                <td className="px-5 py-4 text-sm">{inv.client.nombre}</td>
                <td className="px-5 py-4"><StatusBadge status={inv.estado} /></td>
                <td className="px-5 py-4 text-sm text-right font-mono font-medium">{formatCurrency(inv.total)}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{inv.fechaEmision}</td>
                <td className="px-3 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {inv.estado === ESTADO_BORRADOR && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${inv.id}/edit`);
                          }}
                        >
                          {t('common.edit')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">{t('invoices.notFound')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
