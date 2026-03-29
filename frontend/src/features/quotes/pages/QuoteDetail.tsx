import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes, useSendQuote, useResendQuote, useCopyQuote, useDeleteQuote, useConvertQuoteToInvoice, useDownloadQuotePDF } from '@/features/quotes/hooks/useQuotes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateDDMMYYYY } from '@/lib/calculations';
import { ESTADO_BORRADOR } from '@/lib/constants';
import { ArrowLeft, Pencil, Send, Trash2, Download, ArrowRightLeft, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function QuoteDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();
  const sendMutation = useSendQuote();
  const resendMutation = useResendQuote();
  const deleteMutation = useDeleteQuote();
  const convertMutation = useConvertQuoteToInvoice();
  const copyMutation = useCopyQuote();
  const downloadMutation = useDownloadQuotePDF();

  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const quote = quotes?.find((q) => q.id === id);

  if (isLoading) return <LoadingSpinner />;
  if (!quote) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-muted-foreground">{t('quotes.detail.notFound')}</p>
        <Button variant="link" onClick={() => navigate('/quotes')}>{t('quotes.detail.backLink')}</Button>
      </div>
    );
  }

  const isDraft = quote.estado === ESTADO_BORRADOR;

  const copyToNewDraft = () =>
    copyMutation.mutate(quote.id, {
      onSuccess: (res) => {
        if (res?.data?.id) navigate(`/quotes/${res.data.id}`);
      },
    });

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              {quote.numero ? t('quotes.detail.title', { number: quote.numero }) : t('quotes.detail.titleOnly')}
            </h1>
            <p className="page-subtitle">{quote.client.nombre}</p>
          </div>
          <StatusBadge status={quote.estado} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('quotes.detail.date')}</span>
            <span className="ml-2">{formatDateDDMMYYYY(quote.fecha)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('quotes.detail.client')}</span>
            <span className="ml-2">{quote.client.nombre}</span>
          </div>
        </div>

        {quote.notas && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('quotes.detail.notes')}</span>
            <p className="mt-1">{quote.notas}</p>
          </div>
        )}

        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('quotes.detail.table.description')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('quotes.detail.table.quantity')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('quotes.detail.table.price')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('quotes.detail.table.vat')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase px-5 py-3">{t('quotes.detail.table.subtotal')}</th>
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
          <p className="text-sm text-muted-foreground">{t('quotes.detail.totals.subtotal')} {formatCurrency(quote.subtotal)}</p>
          <p className="text-sm text-muted-foreground">{t('quotes.detail.totals.vat')} {formatCurrency(quote.totalIva)}</p>
          <p className="text-lg font-bold">{t('quotes.detail.totals.total')} {formatCurrency(quote.total)}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" onClick={() => downloadMutation.mutate(quote.id)} disabled={downloadMutation.isPending}>
            <Download className="h-4 w-4 mr-1" />
            {downloadMutation.isPending ? t('common.downloading') : t('common.download')}
          </Button>
          {isDraft && (
            <>
              <Button
                variant="outline"
                className="bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300 hover:text-gray-900"
                onClick={copyToNewDraft}
                disabled={copyMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copyMutation.isPending ? t('common.saving') : t('quotes.detail.copyQuote')}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
              </Button>
              <Button onClick={() => setConfirmSend(true)} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4 mr-1" /> {t('common.send')}
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
              </Button>
            </>
          )}
          {!isDraft && (
            <>
              <Button
                variant="outline"
                className="bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300 hover:text-gray-900"
                onClick={copyToNewDraft}
                disabled={copyMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copyMutation.isPending ? t('common.saving') : t('quotes.detail.copyQuote')}
              </Button>
              <Button
                className="bg-black text-white hover:bg-black/90"
                onClick={() => resendMutation.mutate(quote.id)}
                disabled={resendMutation.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                {resendMutation.isPending ? t('common.saving') : t('common.resend')}
              </Button>
              <Button
                variant="outline"
                className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white"
                onClick={() => setConfirmConvert(true)}
                disabled={convertMutation.isPending}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" /> {t('quotes.detail.convertToInvoice')}
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title={t('quotes.detail.confirmSend.title')}
        description={t('quotes.detail.confirmSend.description')}
        confirmLabel={t('quotes.detail.confirmSend.confirm')}
        onConfirm={() => sendMutation.mutate(quote.id, { onSuccess: () => setConfirmSend(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('quotes.detail.confirmDelete.title')}
        description={t('quotes.detail.confirmDelete.description')}
        confirmLabel={t('quotes.detail.confirmDelete.confirm')}
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(quote.id, { onSuccess: () => navigate('/quotes') })}
      />
      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title={t('quotes.detail.confirmConvert.title')}
        description={t('quotes.detail.confirmConvert.description')}
        confirmLabel={t('quotes.detail.confirmConvert.confirm')}
        onConfirm={() =>
          convertMutation.mutate({ id: quote.id }, { onSuccess: () => navigate('/invoices') })
        }
      />
    </div>
  );
}
