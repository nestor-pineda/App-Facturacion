import { useNavigate } from 'react-router-dom';
import { useCreateQuote } from '@/hooks/useQuotes';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuoteCreate() {
  const navigate = useNavigate();
  const createMutation = useCreateQuote();

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="page-title">Nuevo presupuesto</h1>
        <p className="page-subtitle">Crea un presupuesto para un cliente</p>
      </div>

      <QuoteForm
        onSubmit={(data) =>
          createMutation.mutate(data, {
            onSuccess: () => navigate('/quotes'),
          })
        }
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
