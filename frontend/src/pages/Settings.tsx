import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '@/store/localeStore';
import { useThemeStore } from '@/store/themeStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LOCALE_ES = 'es' as const;
const LOCALE_EN = 'en' as const;

const Settings = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-6">
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
