import { Plus, Search, MoreHorizontal, FileText, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes, useDownloadQuotePDF, useSendQuote } from "@/features/quotes/hooks/useQuotes";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { formatCurrency, formatDateDDMMYYYY } from "@/lib/calculations";
import { ESTADO_BORRADOR, ESTADO_ENVIADO } from "@/lib/constants";
import type { EstadoQuote } from "@/types/enums";
import type { Quote } from "@/types/entities";
import { useTranslation } from "react-i18next";

const STATUS_FILTER_ALL = 'all' as const;
type StatusFilter = typeof STATUS_FILTER_ALL | EstadoQuote;

const Quotes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER_ALL);

  const { data: quotes, isLoading } = useQuotes();
  const downloadPdfMutation = useDownloadQuotePDF();
  const sendMutation = useSendQuote();
  const [quoteToSend, setQuoteToSend] = useState<Quote | null>(null);

  const filtered = (quotes ?? []).filter((q) => {
    const matchesSearch =
      (q.numero ?? '').toLowerCase().includes(search.toLowerCase()) ||
      q.client.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === STATUS_FILTER_ALL || q.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: STATUS_FILTER_ALL, label: t('quotes.filterAll') },
    { value: ESTADO_BORRADOR, label: t('quotes.filterDraft') },
    { value: ESTADO_ENVIADO, label: t('quotes.filterSent') },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t('quotes.title')}</h1>
          <p className="page-subtitle">{t('quotes.subtitle', { count: quotes?.length ?? 0 })}</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('quotes.newButton')}
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('quotes.searchPlaceholder')}
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

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={(quotes?.length ?? 0) === 0 ? t('quotes.emptyState.title') : t('quotes.notFound')}
          description={
            (quotes?.length ?? 0) === 0
              ? t('quotes.emptyState.description')
              : t('quotes.emptyState.tryOtherTerms')
          }
          action={
            (quotes?.length ?? 0) === 0 ? (
              <Button onClick={() => navigate('/quotes/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('quotes.newButton')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.number')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.client')}</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.status')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.lines')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.total')}</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{t('quotes.table.date')}</th>
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
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{formatDateDDMMYYYY(quote.fecha)}</td>
                <td className="px-3 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {quote.estado === ESTADO_BORRADOR && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotes/${quote.id}/edit`);
                            }}
                          >
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuoteToSend(quote);
                            }}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendMutation.isPending ? t('common.saving') : t('common.send')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPdfMutation.mutate(quote.id);
                            }}
                            disabled={downloadPdfMutation.isPending}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {downloadPdfMutation.isPending ? t('common.downloading') : t('common.download')}
                          </DropdownMenuItem>
                        </>
                      )}
                      {quote.estado === ESTADO_ENVIADO && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdfMutation.mutate(quote.id);
                          }}
                          disabled={downloadPdfMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {downloadPdfMutation.isPending ? t('common.downloading') : t('common.download')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!quoteToSend}
        onOpenChange={(open) => !open && setQuoteToSend(null)}
        title={t('quotes.detail.confirmSend.title')}
        description={t('quotes.detail.confirmSend.description')}
        confirmLabel={t('quotes.detail.confirmSend.confirm')}
        onConfirm={() => {
          if (quoteToSend) {
            sendMutation.mutate(quoteToSend.id, { onSuccess: () => setQuoteToSend(null) });
          }
        }}
      />
    </div>
  );
};

export default Quotes;
