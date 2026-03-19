import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes, useUpdateQuote } from '@/features/quotes/hooks/useQuotes';
import { QuoteForm } from '@/features/quotes/components/QuoteForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ESTADO_BORRADOR } from '@/lib/constants';
import type { CreateQuoteInput } from '@/schemas/quote.schema';
import type { Quote, QuoteLine } from '@/types/entities';

/** API may return snake_case for lines; normalize to form input (camelCase). */
function quoteToFormInput(quote: Quote): CreateQuoteInput {
  const raw = quote as Quote & { fecha?: string };
  const fechaValue = raw.fecha ?? quote.fecha;
  const fecha =
    typeof fechaValue === 'string' && fechaValue.includes('T')
      ? fechaValue.split('T')[0]
      : (fechaValue ?? '');
  return {
    clientId: quote.client.id,
    fecha: fecha || new Date().toISOString().split('T')[0],
    notas: quote.notas ?? '',
    lines: quote.lines.map((l) => {
      const line = l as QuoteLine & { precio_unitario?: number; service_id?: string | null; iva_porcentaje?: number };
      return {
        serviceId: line.service_id ?? line.serviceId ?? null,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad) || 1,
        precioUnitario: Number(line.precio_unitario ?? l.precioUnitario) || 0,
        ivaPorcentaje: Number(line.iva_porcentaje ?? l.ivaPorcentaje) || 21,
      };
    }),
  };
}

export default function QuoteEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();
  const updateMutation = useUpdateQuote();

  const quote = id ? quotes?.find((q) => q.id === id) : undefined;
  const isDraft = quote?.estado === ESTADO_BORRADOR;

  useEffect(() => {
    if (isLoading || !id) return;
    if (!quote) {
      navigate(`/quotes/${id}`, { replace: true });
      return;
    }
    if (!isDraft) {
      navigate(`/quotes/${id}`, { replace: true });
    }
  }, [isLoading, id, quote, isDraft, navigate]);

  if (isLoading) return <LoadingSpinner />;
  if (!quote || !isDraft) return null;

  const handleSubmit = async (data: CreateQuoteInput) => {
    try {
      await updateMutation.mutateAsync({ id: quote.id, data });
      navigate(`/quotes/${quote.id}`);
    } catch {
      // Error toast is shown by useUpdateQuote onError
    }
  };

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotes/${id}`)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <h1 className="page-title">{t('quotes.edit.title')}</h1>
        <p className="page-subtitle">{quote.client.nombre}</p>
      </div>

      <QuoteForm
        key={quote.id}
        isEdit
        defaultValues={quoteToFormInput(quote)}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
