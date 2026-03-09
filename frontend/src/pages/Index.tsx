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

const actions = [
  { label: "Nuevo presupuesto", icon: FileText, path: "/quotes/new", description: "Crear propuesta de precio" },
  { label: "Nueva factura", icon: Receipt, path: "/invoices/new", description: "Generar una factura" },
  { label: "Nuevo cliente", icon: Users, path: "/clients", description: "Registrar un nuevo cliente" },
];

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
      number: inv.numero ?? '(borrador)',
      clientName: inv.client.nombre,
      total: inv.total,
      status: inv.estado as EstadoDocument,
      date: inv.fechaEmision,
    })),
    ...(quotes ?? []).map((q) => ({
      id: q.id,
      type: 'quote' as const,
      number: q.numero ?? '(borrador)',
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen y acciones rápidas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Facturas</p>
          <p className="text-2xl font-bold">{totalInvoices}</p>
          <p className="text-xs text-muted-foreground">{invoicesDraft} borrador · {invoicesSent} enviadas</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Presupuestos</p>
          <p className="text-2xl font-bold">{totalQuotes}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Clientes</p>
          <p className="text-2xl font-bold">{totalClients}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Facturado</p>
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
          <h2 className="text-xl font-bold">Actividad reciente</h2>
        </div>

        <div className="filter-bar">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {([
              { value: "all" as FilterType, label: "Todos" },
              { value: "quote" as FilterType, label: "Presupuestos" },
              { value: "invoice" as FilterType, label: "Facturas" },
            ]).map((f) => (
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Número</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Fecha</th>
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
                  <td className="px-5 py-4 text-sm text-muted-foreground">{item.type === 'invoice' ? 'Factura' : 'Presupuesto'}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-sm text-right font-mono font-medium">{formatCurrency(item.total)}</td>
                  <td className="px-5 py-4 text-sm text-right text-muted-foreground">{item.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No hay actividad reciente
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
