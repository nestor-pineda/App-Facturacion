import { useNavigate } from 'react-router-dom';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { InvoiceForm } from '@/components/forms/InvoiceForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="page-title">Nueva factura</h1>
        <p className="page-subtitle">Crea una factura para un cliente</p>
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
