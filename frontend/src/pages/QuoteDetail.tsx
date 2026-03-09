import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes, useSendQuote, useDeleteQuote, useConvertQuoteToInvoice, useDownloadQuotePDF } from '@/hooks/useQuotes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/calculations';
import { ESTADO_BORRADOR } from '@/lib/constants';
import { ArrowLeft, Send, Trash2, Download, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();
  const sendMutation = useSendQuote();
  const deleteMutation = useDeleteQuote();
  const convertMutation = useConvertQuoteToInvoice();
  const downloadMutation = useDownloadQuotePDF();

  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const quote = quotes?.find((q) => q.id === id);

  if (isLoading) return <LoadingSpinner />;
  if (!quote) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-muted-foreground">Presupuesto no encontrado</p>
        <Button variant="link" onClick={() => navigate('/quotes')}>Volver a presupuestos</Button>
      </div>
    );
  }

  const isDraft = quote.estado === ESTADO_BORRADOR;

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Presupuesto {quote.numero ?? '(sin número)'}</h1>
            <p className="page-subtitle">{quote.client.nombre}</p>
          </div>
          <StatusBadge status={quote.estado} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Fecha:</span>
            <span className="ml-2">{quote.fecha}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente:</span>
            <span className="ml-2">{quote.client.nombre}</span>
          </div>
        </div>

        {quote.notas && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas:</span>
            <p className="mt-1">{quote.notas}</p>
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
              {quote.lines.map((line) => (
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
          <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(quote.subtotal)}</p>
          <p className="text-sm text-muted-foreground">IVA: {formatCurrency(quote.totalIva)}</p>
          <p className="text-lg font-bold">Total: {formatCurrency(quote.total)}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" onClick={() => downloadMutation.mutate(quote.id)} disabled={downloadMutation.isPending}>
            <Download className="h-4 w-4 mr-1" /> {downloadMutation.isPending ? 'Descargando...' : 'Descargar PDF'}
          </Button>
          {isDraft && (
            <>
              <Button onClick={() => setConfirmSend(true)} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4 mr-1" /> Enviar
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            </>
          )}
          {!isDraft && (
            <Button variant="outline" onClick={() => setConfirmConvert(true)} disabled={convertMutation.isPending}>
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Convertir a factura
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Enviar presupuesto"
        description="Una vez enviado, el presupuesto no podrá editarse. ¿Continuar?"
        confirmLabel="Enviar"
        onConfirm={() => sendMutation.mutate(quote.id, { onSuccess: () => setConfirmSend(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar presupuesto"
        description="Esta acción no se puede deshacer. ¿Eliminar?"
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(quote.id, { onSuccess: () => navigate('/quotes') })}
      />
      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title="Convertir a factura"
        description="Se creará una nueva factura en borrador con los datos de este presupuesto."
        confirmLabel="Convertir"
        onConfirm={() =>
          convertMutation.mutate({ id: quote.id }, { onSuccess: () => navigate('/invoices') })
        }
      />
    </div>
  );
}
