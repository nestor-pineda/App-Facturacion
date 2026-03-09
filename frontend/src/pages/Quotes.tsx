import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency } from "@/lib/calculations";
import { ESTADO_BORRADOR, ESTADO_ENVIADO } from "@/lib/constants";
import type { EstadoQuote } from "@/types/enums";

const STATUS_FILTER_ALL = 'all' as const;
type StatusFilter = typeof STATUS_FILTER_ALL | EstadoQuote;

const Quotes = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER_ALL);

  const { data: quotes, isLoading } = useQuotes();

  const filtered = (quotes ?? []).filter((q) => {
    const matchesSearch =
      (q.numero ?? '').toLowerCase().includes(search.toLowerCase()) ||
      q.client.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === STATUS_FILTER_ALL || q.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: STATUS_FILTER_ALL, label: 'Todos' },
    { value: ESTADO_BORRADOR, label: 'Borrador' },
    { value: ESTADO_ENVIADO, label: 'Enviado' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-subtitle">{quotes?.length ?? 0} presupuestos</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo presupuesto
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar presupuestos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Número</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cliente</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Estado</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Líneas</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Total</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Fecha</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => (
              <tr
                key={quote.id}
                onClick={() => navigate(`/quotes/${quote.id}`)}
                className="border-b border-border last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 font-mono text-sm font-medium">{quote.numero ?? '—'}</td>
                <td className="px-5 py-4 text-sm">{quote.client.nombre}</td>
                <td className="px-5 py-4"><StatusBadge status={quote.estado} /></td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{quote.lines.length}</td>
                <td className="px-5 py-4 text-sm text-right font-mono font-medium">{formatCurrency(quote.total)}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{quote.fecha}</td>
                <td className="px-3 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No se encontraron presupuestos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotes;
