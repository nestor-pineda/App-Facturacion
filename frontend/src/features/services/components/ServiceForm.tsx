import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FORM_VALIDATION_MODE } from '@/lib/constants';
import { createServiceSchema, type ServiceInput } from '@/schemas/service.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface ServiceFormProps {
  onSubmit: (data: ServiceInput) => void;
  isLoading?: boolean;
}

export function ServiceForm({ onSubmit, isLoading }: ServiceFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    mode: FORM_VALIDATION_MODE,
    resolver: zodResolver(createServiceSchema()),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">{t('forms.name')}</Label>
        <Input id="nombre" placeholder={t('forms.clientPlaceholder')} {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">{t('forms.description')}</Label>
        <Textarea id="descripcion" placeholder={t('forms.descriptionPlaceholder')} {...register('descripcion')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precioBase">{t('forms.basePrice')}</Label>
        <Input id="precioBase" type="number" step="0.01" min="0" placeholder="0.00" {...register('precioBase')} />
        {errors.precioBase && <p className="text-sm text-destructive">{errors.precioBase.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('forms.saving') : t('forms.createService')}
      </Button>
    </form>
  );
}
