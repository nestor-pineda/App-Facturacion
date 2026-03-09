import { useNavigate } from 'react-router-dom';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { InvoiceForm } from '@/components/forms/InvoiceForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function InvoiceCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <h1 className="page-title">{t('invoices.create.title')}</h1>
        <p className="page-subtitle">{t('invoices.create.subtitle')}</p>
      </div>

      <InvoiceForm
        onSubmit={(data) =>
          createMutation.mutate(data, {
            onSuccess: () => navigate('/invoices'),
          })
        }
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
