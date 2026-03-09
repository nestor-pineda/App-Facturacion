import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices, useSendInvoice, useDeleteInvoice, useDownloadInvoicePDF } from '@/hooks/useInvoices';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/calculations';
import { ESTADO_BORRADOR, ESTADO_ENVIADA } from '@/lib/constants';
import { ArrowLeft, Send, Trash2, Download } from 'lucide-react';
import { useState } from 'react';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const sendMutation = useSendInvoice();
  const deleteMutation = useDeleteInvoice();
  const downloadMutation = useDownloadInvoicePDF();

  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoice = invoices?.find((inv) => inv.id === id);

  if (isLoading) return <LoadingSpinner />;
  if (!invoice) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-muted-foreground">Factura no encontrada</p>
        <Button variant="link" onClick={() => navigate('/invoices')}>Volver a facturas</Button>
      </div>
    );
  }

  const isDraft = invoice.estado === ESTADO_BORRADOR;
  const isSent = invoice.estado === ESTADO_ENVIADA;

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              Factura {invoice.numero ?? '(borrador)'}
            </h1>
            <p className="page-subtitle">{invoice.client.nombre}</p>
          </div>
          <StatusBadge status={invoice.estado} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Fecha de emisión:</span>
            <span className="ml-2">{invoice.fechaEmision}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente:</span>
            <span className="ml-2">{invoice.client.nombre}</span>
          </div>
          {invoice.numero && (
            <div>
              <span className="text-muted-foreground">Número:</span>
              <span className="ml-2 font-mono">{invoice.numero}</span>
            </div>
          )}
        </div>

        {invoice.notas && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas:</span>
            <p className="mt-1">{invoice.notas}</p>
          </div>
        )}

        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Descripción</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Cantidad</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Precio</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">IVA</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm">{line.descripcion}</td>
                  <td className="px-5 py-3 text-sm text-right">{line.cantidad}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono">{formatCurrency(line.precioUnitario)}</td>
                  <td className="px-5 py-3 text-sm text-right">{line.ivaPorcentaje}%</td>
                  <td className="px-5 py-3 text-sm text-right font-mono">{formatCurrency(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-4 space-y-1 text-right">
          <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(invoice.subtotal)}</p>
          <p className="text-sm text-muted-foreground">IVA: {formatCurrency(invoice.totalIva)}</p>
          <p className="text-lg font-bold">Total: {formatCurrency(invoice.total)}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          {isSent && (
            <Button variant="outline" onClick={() => downloadMutation.mutate(invoice.id)} disabled={downloadMutation.isPending}>
              <Download className="h-4 w-4 mr-1" /> {downloadMutation.isPending ? 'Descargando...' : 'Descargar PDF'}
            </Button>
          )}
          {isDraft && (
            <>
              <Button onClick={() => setConfirmSend(true)} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4 mr-1" /> Enviar factura
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Enviar factura"
        description="Al enviar, se generará un número legal correlativo y la factura será inmutable. Esta acción no se puede deshacer."
        confirmLabel="Enviar factura"
        onConfirm={() => sendMutation.mutate(invoice.id, { onSuccess: () => setConfirmSend(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar factura"
        description="Esta acción no se puede deshacer. ¿Eliminar la factura?"
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(invoice.id, { onSuccess: () => navigate('/invoices') })}
      />
    </div>
  );
}
