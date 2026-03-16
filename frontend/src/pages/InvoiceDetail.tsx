import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices, useSendInvoice, useDeleteInvoice, useDownloadInvoicePDF } from '@/hooks/useInvoices';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/calculations';
import { ESTADO_BORRADOR, ESTADO_ENVIADA } from '@/lib/constants';
import { ArrowLeft, Pencil, Send, Trash2, Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const sendMutation = useSendInvoice();
  const deleteMutation = useDeleteInvoice();
  const downloadMutation = useDownloadInvoicePDF();

  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoice = invoices?.find((inv) => inv.id === id);
  const rawInvoice = invoice as typeof invoice & { fecha_emision?: string; total_iva?: number };
  const displayDate = rawInvoice?.fecha_emision ?? invoice?.fechaEmision ?? '';
  const displayTotalIva = rawInvoice?.total_iva ?? invoice?.totalIva ?? 0;

  if (isLoading) return <LoadingSpinner />;
  if (!invoice) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-muted-foreground">{t('invoices.detail.notFound')}</p>
        <Button variant="link" onClick={() => navigate('/invoices')}>{t('invoices.detail.backLink')}</Button>
      </div>
    );
  }

  const isDraft = invoice.estado === ESTADO_BORRADOR;
  const isSent = invoice.estado === ESTADO_ENVIADA;

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              {t('invoices.detail.title', { number: invoice.numero ?? t('common.draft') })}
            </h1>
            <p className="page-subtitle">{invoice.client.nombre}</p>
          </div>
          <StatusBadge status={invoice.estado} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('invoices.detail.issueDate')}</span>
            <span className="ml-2">{displayDate}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('invoices.detail.client')}</span>
            <span className="ml-2">{invoice.client.nombre}</span>
          </div>
          {invoice.numero && (
            <div>
              <span className="text-muted-foreground">{t('invoices.detail.number')}</span>
              <span className="ml-2 font-mono">{invoice.numero}</span>
            </div>
          )}
        </div>

        {invoice.notas && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('invoices.detail.notes')}</span>
            <p className="mt-1">{invoice.notas}</p>
          </div>
        )}

        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('invoices.detail.table.description')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('invoices.detail.table.quantity')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('invoices.detail.table.price')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('invoices.detail.table.vat')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('invoices.detail.table.subtotal')}</th>
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
          <p className="text-sm text-muted-foreground">{t('invoices.detail.totals.subtotal')} {formatCurrency(invoice.subtotal)}</p>
          <p className="text-sm text-muted-foreground">{t('invoices.detail.totals.vat')} {formatCurrency(displayTotalIva)}</p>
          <p className="text-lg font-bold">{t('invoices.detail.totals.total')} {formatCurrency(invoice.total)}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          {isSent && (
            <Button variant="outline" onClick={() => downloadMutation.mutate(invoice.id)} disabled={downloadMutation.isPending}>
              <Download className="h-4 w-4 mr-1" />
              {downloadMutation.isPending ? t('common.downloading') : t('common.download')}
            </Button>
          )}
          {isDraft && (
            <>
              <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
              </Button>
              <Button onClick={() => setConfirmSend(true)} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4 mr-1" /> {t('invoices.detail.sendInvoice')}
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title={t('invoices.detail.confirmSend.title')}
        description={t('invoices.detail.confirmSend.description')}
        confirmLabel={t('invoices.detail.confirmSend.confirm')}
        onConfirm={() => sendMutation.mutate(invoice.id, { onSuccess: () => setConfirmSend(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('invoices.detail.confirmDelete.title')}
        description={t('invoices.detail.confirmDelete.description')}
        confirmLabel={t('invoices.detail.confirmDelete.confirm')}
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(invoice.id, { onSuccess: () => navigate('/invoices') })}
      />
    </div>
  );
}
