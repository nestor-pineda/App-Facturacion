import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices, useUpdateInvoice } from '@/hooks/useInvoices';
import { InvoiceForm } from '@/components/forms/InvoiceForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ESTADO_BORRADOR } from '@/lib/constants';
import type { CreateInvoiceInput } from '@/schemas/invoice.schema';
import type { Invoice } from '@/types/entities';

function invoiceToFormInput(invoice: Invoice): CreateInvoiceInput {
  const fechaEmision =
    typeof invoice.fechaEmision === 'string' && invoice.fechaEmision.includes('T')
      ? invoice.fechaEmision.split('T')[0]
      : invoice.fechaEmision;
  return {
    clientId: invoice.client.id,
    fechaEmision,
    notas: invoice.notas ?? '',
    lines: invoice.lines.map((l) => ({
      serviceId: l.serviceId,
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad) || 0,
      precioUnitario: Number(l.precioUnitario) || 0,
      ivaPorcentaje: Number(l.ivaPorcentaje) ?? 21,
    })),
  };
}

export default function InvoiceEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const updateMutation = useUpdateInvoice();

  const invoice = id ? invoices?.find((inv) => inv.id === id) : undefined;
  const isDraft = invoice?.estado === ESTADO_BORRADOR;

  useEffect(() => {
    if (isLoading || !id) return;
    if (!invoice) {
      navigate(`/invoices/${id}`, { replace: true });
      return;
    }
    if (!isDraft) {
      navigate(`/invoices/${id}`, { replace: true });
    }
  }, [isLoading, id, invoice, isDraft, navigate]);

  if (isLoading) return <LoadingSpinner />;
  if (!invoice || !isDraft) return null;

  const handleSubmit = async (data: CreateInvoiceInput) => {
    try {
      await updateMutation.mutateAsync({ id: invoice.id, data });
      navigate(`/invoices/${invoice.id}`);
    } catch {
      // Error toast is shown by useUpdateInvoice onError
    }
  };

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${id}`)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <h1 className="page-title">{t('invoices.edit.title')}</h1>
        <p className="page-subtitle">{invoice.client.nombre}</p>
      </div>

      <InvoiceForm
        key={invoice.id}
        isEdit
        defaultValues={invoiceToFormInput(invoice)}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
