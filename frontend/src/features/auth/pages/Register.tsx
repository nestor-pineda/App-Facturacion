import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FORM_VALIDATION_MODE } from '@/lib/constants';
import {
  createRegisterSchema,
  REGISTER_PASSWORD_COMPLEXITY_REGEX,
  REGISTER_PASSWORD_MIN_LENGTH,
  type RegisterInput,
} from '@/schemas/auth.schema';
import { registerUser } from '@/api/endpoints/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getApiErrorMessage } from '@/lib/api-error';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    mode: FORM_VALIDATION_MODE,
    resolver: zodResolver(createRegisterSchema()),
  });
  const passwordValue = watch('password', '');
  const passwordRequirements = [
    {
      label: t('auth.register.passwordRequirements.minLength', {
        count: REGISTER_PASSWORD_MIN_LENGTH,
      }),
      isMet: passwordValue.length >= REGISTER_PASSWORD_MIN_LENGTH,
    },
    {
      label: t('auth.register.passwordRequirements.lowercase'),
      isMet: /[a-z]/.test(passwordValue),
    },
    {
      label: t('auth.register.passwordRequirements.uppercase'),
      isMet: /[A-Z]/.test(passwordValue),
    },
    {
      label: t('auth.register.passwordRequirements.number'),
      isMet: /\d/.test(passwordValue),
    },
    {
      label: t('auth.register.passwordRequirements.format'),
      isMet: REGISTER_PASSWORD_COMPLEXITY_REGEX.test(passwordValue),
    },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success(i18next.t('toast.accountCreated'));
      navigate('/login');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, i18next.t('toast.registerError')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t('auth.register.passwordRequirements.title')}
                </p>
                <ul className="space-y-1">
                  {passwordRequirements.map((requirement) => (
                    <li
                      key={requirement.label}
                      className={`text-xs ${requirement.isMet ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      {requirement.label}
                    </li>
                  ))}
                </ul>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreComercial">{t('auth.register.businessName')}</Label>
              <Input id="nombreComercial" placeholder="Tu negocio S.L." {...register('nombreComercial')} />
              {errors.nombreComercial && <p className="text-sm text-destructive">{errors.nombreComercial.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nif">{t('auth.register.nif')}</Label>
              <Input id="nif" placeholder="12345678A" {...register('nif')} />
              {errors.nif && <p className="text-sm text-destructive">{errors.nif.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccionFiscal">{t('auth.register.fiscalAddress')}</Label>
              <Input id="direccionFiscal" placeholder="Calle Example 1, Madrid" {...register('direccionFiscal')} />
              {errors.direccionFiscal && <p className="text-sm text-destructive">{errors.direccionFiscal.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">{t('auth.register.phone')}</Label>
              <Input id="telefono" placeholder="+34 600 000 000" {...register('telefono')} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
