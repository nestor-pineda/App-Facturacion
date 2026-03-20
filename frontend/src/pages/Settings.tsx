import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '@/store/localeStore';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createUpdateProfileSchema, type UpdateProfileInput } from '@/schemas/auth.schema';
import { updateCurrentUser } from '@/api/endpoints/auth';
import { toast } from 'sonner';
import i18next from 'i18next';
import { getApiErrorMessage } from '@/lib/api-error';

const LOCALE_ES = 'es' as const;
const LOCALE_EN = 'en' as const;
const EMPTY_VALUE = '';
const USER_NOMBRE_COMERCIAL_CAMEL_KEY = 'nombreComercial';
const USER_DIRECCION_FISCAL_CAMEL_KEY = 'direccionFiscal';
const USER_NOMBRE_COMERCIAL_SNAKE_KEY = 'nombre_comercial';
const USER_DIRECCION_FISCAL_SNAKE_KEY = 'direccion_fiscal';

const getStringField = (source: unknown, ...keys: string[]): string | undefined => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const sourceRecord = source as Record<string, unknown>;
  for (const key of keys) {
    const value = sourceRecord[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
};

const Settings = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const userCommercialName =
    getStringField(user, USER_NOMBRE_COMERCIAL_CAMEL_KEY, USER_NOMBRE_COMERCIAL_SNAKE_KEY) ?? EMPTY_VALUE;
  const userFiscalAddress =
    getStringField(user, USER_DIRECCION_FISCAL_CAMEL_KEY, USER_DIRECCION_FISCAL_SNAKE_KEY) ?? EMPTY_VALUE;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(createUpdateProfileSchema()),
    values: {
      email: user?.email ?? EMPTY_VALUE,
      nombreComercial: userCommercialName,
      nif: user?.nif ?? EMPTY_VALUE,
      direccionFiscal: userFiscalAddress,
      telefono: user?.telefono ?? EMPTY_VALUE,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      const response = await updateCurrentUser({
        ...data,
        telefono: data.telefono?.trim() || undefined,
      });
      login(response.data.user);
      toast.success(i18next.t('toast.profileUpdated'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, i18next.t('toast.profileUpdateError')));
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <div className="stat-card space-y-4">
          <h2 className="text-base font-semibold">{t('settings.profile')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.profileDescription')}</p>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="nombreComercial">{t('auth.register.businessName')}</Label>
              <Input id="nombreComercial" {...register('nombreComercial')} />
              {errors.nombreComercial && (
                <p className="text-sm text-destructive">{errors.nombreComercial.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nif">{t('auth.register.nif')}</Label>
              <Input id="nif" {...register('nif')} />
              {errors.nif && <p className="text-sm text-destructive">{errors.nif.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccionFiscal">{t('auth.register.fiscalAddress')}</Label>
              <Input id="direccionFiscal" {...register('direccionFiscal')} />
              {errors.direccionFiscal && (
                <p className="text-sm text-destructive">{errors.direccionFiscal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">{t('auth.register.phone')}</Label>
              <Input id="telefono" {...register('telefono')} />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('forms.saveChanges')}
            </Button>
          </form>
        </div>

        <div className="stat-card space-y-4">
          <h2 className="text-base font-semibold">{t('settings.language')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.languageLabel')}</p>
          <Select
            value={locale}
            onValueChange={(v) => setLocale(v as typeof LOCALE_ES | typeof LOCALE_EN)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LOCALE_ES}>{t('settings.langEs')}</SelectItem>
              <SelectItem value={LOCALE_EN}>{t('settings.langEn')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="stat-card space-y-4">
          <h2 className="text-base font-semibold">{t('settings.theme')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.themeDescription')}</p>
          <div className="flex items-center gap-3">
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
            <Label htmlFor="dark-mode">{t('settings.themeLabel')}</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
