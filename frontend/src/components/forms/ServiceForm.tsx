import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema, type ServiceInput } from '@/schemas/service.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ServiceFormProps {
  onSubmit: (data: ServiceInput) => void;
  isLoading?: boolean;
}

export function ServiceForm({ onSubmit, isLoading }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" placeholder="Nombre del servicio" {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea id="descripcion" placeholder="Descripción del servicio" {...register('descripcion')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precioBase">Precio base (€)</Label>
        <Input id="precioBase" type="number" step="0.01" min="0" placeholder="0.00" {...register('precioBase')} />
        {errors.precioBase && <p className="text-sm text-destructive">{errors.precioBase.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Crear servicio'}
      </Button>
    </form>
  );
}
