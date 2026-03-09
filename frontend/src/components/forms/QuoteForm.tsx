import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createQuoteSchema, type CreateQuoteInput } from '@/schemas/quote.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { calculateTotals, formatCurrency } from '@/lib/calculations';
import { IVA_DEFAULT } from '@/lib/constants';
import { Plus, Trash2 } from 'lucide-react';

interface QuoteFormProps {
  onSubmit: (data: CreateQuoteInput) => void;
  isLoading?: boolean;
}

export function QuoteForm({ onSubmit, isLoading }: QuoteFormProps) {
  const { data: clients } = useClients();
  const { data: services } = useServices();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      lines: [{ serviceId: null, descripcion: '', cantidad: 1, precioUnitario: 0, ivaPorcentaje: IVA_DEFAULT }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines');

  const totals = calculateTotals(
    (watchedLines ?? []).map((l) => ({
      cantidad: Number(l.cantidad) || 0,
      precioUnitario: Number(l.precioUnitario) || 0,
      ivaPorcentaje: Number(l.ivaPorcentaje) || IVA_DEFAULT,
    })),
  );

  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    if (service) {
      setValue(`lines.${index}.serviceId`, service.id);
      setValue(`lines.${index}.descripcion`, service.nombre);
      setValue(`lines.${index}.precioUnitario`, service.precioBase);
      setValue(`lines.${index}.ivaPorcentaje`, service.ivaPorcentaje);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select onValueChange={(v) => setValue('clientId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" {...register('fecha')} />
          {errors.fecha && <p className="text-sm text-destructive">{errors.fecha.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas (opcional)</Label>
        <Textarea id="notas" placeholder="Notas adicionales..." {...register('notas')} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Líneas</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ serviceId: null, descripcion: '', cantidad: 1, precioUnitario: 0, ivaPorcentaje: IVA_DEFAULT })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Añadir línea
          </Button>
        </div>
        {errors.lines?.root && <p className="text-sm text-destructive">{errors.lines.root.message}</p>}

        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Línea {index + 1}</span>
              <div className="flex items-center gap-2">
                {services && services.length > 0 && (
                  <Select onValueChange={(v) => handleServiceSelect(index, v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Desde catálogo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1">
                <Label>Descripción</Label>
                <Input {...register(`lines.${index}.descripcion`)} placeholder="Descripción" />
                {errors.lines?.[index]?.descripcion && (
                  <p className="text-xs text-destructive">{errors.lines[index].descripcion.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Cantidad</Label>
                <Input type="number" step="0.01" min="0.01" {...register(`lines.${index}.cantidad`)} />
              </div>
              <div className="space-y-1">
                <Label>Precio unitario (€)</Label>
                <Input type="number" step="0.01" min="0" {...register(`lines.${index}.precioUnitario`)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-1 text-right">
        <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(totals.subtotal)}</p>
        <p className="text-sm text-muted-foreground">IVA: {formatCurrency(totals.totalIva)}</p>
        <p className="text-lg font-bold">Total: {formatCurrency(totals.total)}</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Crear presupuesto'}
      </Button>
    </form>
  );
}
