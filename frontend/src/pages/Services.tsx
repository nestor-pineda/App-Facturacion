import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useServices, useCreateService } from "@/hooks/useServices";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency } from "@/lib/calculations";
import type { ServiceInput } from "@/schemas/service.schema";
import { useTranslation } from "react-i18next";

const Services = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: services, isLoading } = useServices();
  const createMutation = useCreateService();

  const filtered = (services ?? []).filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: ServiceInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t('services.title')}</h1>
          <p className="page-subtitle">{t('services.subtitle', { count: services?.length ?? 0 })}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('services.newButton')}
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('services.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? t('services.notFound') : t('services.empty')}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('services.table.service')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('services.table.description')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('services.table.basePrice')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('services.table.vat')}</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((service) => (
                <tr key={service.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
                  <td className="px-5 py-4 font-medium text-sm">{service.nombre}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{service.descripcion || '—'}</td>
                  <td className="px-5 py-4 text-sm text-right font-mono font-medium">{formatCurrency(service.precioBase)}</td>
                  <td className="px-5 py-4 text-sm text-right text-muted-foreground">{service.ivaPorcentaje}%</td>
                  <td className="px-3 py-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('services.dialogNew')}</DialogTitle>
          </DialogHeader>
          <ServiceForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
