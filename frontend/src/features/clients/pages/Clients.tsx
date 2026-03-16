import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useClients, useCreateClient, useUpdateClient } from "@/features/clients/hooks/useClients";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { CardGridSkeleton } from "@/components/common/CardGridSkeleton";
import type { Client } from "@/types/entities";
import type { ClientInput } from "@/schemas/client.schema";
import { useTranslation } from "react-i18next";

const Clients = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const filtered = (clients ?? []).filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: ClientInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleUpdate = (data: ClientInput) => {
    if (!editingClient) return;
    updateMutation.mutate(
      { id: editingClient.id, data },
      { onSuccess: () => setEditingClient(null) },
    );
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t('clients.title')}</h1>
          <p className="page-subtitle">{t('clients.subtitle', { count: clients?.length ?? 0 })}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('clients.newButton')}
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('clients.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? t('clients.notFound') : t('clients.emptyState.title')}
          description={search ? t('clients.emptyState.tryOtherTerms') : t('clients.emptyState.description')}
          action={
            !search ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('clients.newButton')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="stat-card flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base">{client.nombre}</h3>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </div>
                {client.telefono && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {client.telefono}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {client.cifNif}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {client.direccion}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(client)}>{t('clients.edit')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients.dialogNew')}</DialogTitle>
          </DialogHeader>
          <ClientForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients.dialogEdit')}</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm
              defaultValues={editingClient}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
