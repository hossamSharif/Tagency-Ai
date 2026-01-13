'use client';

/**
 * Preferences Settings Form Component
 *
 * Form for changing user preferences: language and theme
 */

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor, Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { locales, localeNames, type Locale } from '@/i18n';

interface PreferencesSettingsFormProps {
  locale: string;
}

const themes = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const;

export function PreferencesSettingsForm({ locale }: PreferencesSettingsFormProps) {
  const t = useTranslations('settings');
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(locale as Locale);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(t('themeUpdated'));
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setSelectedLanguage(newLocale);

    // Replace the current locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    toast.success(t('languageUpdated'));
    router.push(newPath);
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t('theme')}</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted/50',
                theme === value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <Icon className={cn(
                'h-6 w-6',
                theme === value ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-sm font-medium',
                theme === value ? 'text-primary' : 'text-muted-foreground'
              )}>
                {t(`themes.${value}`)}
              </span>
              {theme === value && (
                <div className="absolute top-2 end-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t('language')}</Label>
        <div className="grid grid-cols-2 gap-3">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLanguageChange(loc)}
              className={cn(
                'relative flex items-center justify-center gap-3 rounded-lg border-2 p-4 transition-all hover:bg-muted/50',
                locale === loc
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <span className="text-2xl">{loc === 'ar' ? '🇸🇦' : '🇺🇸'}</span>
              <div className="flex flex-col items-start">
                <span className={cn(
                  'font-medium',
                  locale === loc ? 'text-primary' : 'text-foreground'
                )}>
                  {localeNames[loc].native}
                </span>
                <span className="text-xs text-muted-foreground">
                  {localeNames[loc].english}
                </span>
              </div>
              {locale === loc && (
                <div className="absolute top-2 end-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
