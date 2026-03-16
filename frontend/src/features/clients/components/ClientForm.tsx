import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientSchema, type ClientInput } from '@/schemas/client.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '@/types/entities';
import { useTranslation } from 'react-i18next';

interface ClientFormProps {
  defaultValues?: Client;
  onSubmit: (data: ClientInput) => void;
  isLoading?: boolean;
}

export function ClientForm({ defaultValues, onSubmit, isLoading }: ClientFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(createClientSchema()),
    defaultValues: defaultValues
      ? {
          nombre: defaultValues.nombre,
          email: defaultValues.email,
          cifNif: defaultValues.cifNif,
          direccion: defaultValues.direccion,
          telefono: defaultValues.telefono ?? '',
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">{t('forms.name')}</Label>
        <Input id="nombre" placeholder={t('forms.clientPlaceholder')} {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('forms.email')}</Label>
        <Input id="email" type="email" placeholder="email@ejemplo.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cifNif">{t('forms.cifNif')}</Label>
        <Input id="cifNif" placeholder="B12345678" {...register('cifNif')} />
        {errors.cifNif && <p className="text-sm text-destructive">{errors.cifNif.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="direccion">{t('forms.address')}</Label>
        <Input id="direccion" placeholder="Calle Example 1, Madrid" {...register('direccion')} />
        {errors.direccion && <p className="text-sm text-destructive">{errors.direccion.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefono">{t('forms.phone')}</Label>
        <Input id="telefono" placeholder="+34 600 000 000" {...register('telefono')} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? t('forms.saving')
          : defaultValues
          ? t('forms.updateClient')
          : t('forms.createClient')}
      </Button>
    </form>
  );
}
