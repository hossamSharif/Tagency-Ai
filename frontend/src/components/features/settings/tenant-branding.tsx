'use client';

/**
 * Tenant Branding Component (T216)
 *
 * Component for managing workspace branding settings (logo, colors, etc.)
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/hooks/use-tenant';
import { updateTenantAction } from '@/app/actions/tenants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Palette, Sun, Moon, Monitor, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ThemePreference } from '@/types/models/tenant';

interface TenantBrandingProps {
  locale: string;
}

const THEME_OPTIONS: { value: ThemePreference; labelEn: string; labelAr: string; icon: typeof Sun }[] = [
  { value: 'light', labelEn: 'Light', labelAr: 'فاتح', icon: Sun },
  { value: 'dark', labelEn: 'Dark', labelAr: 'داكن', icon: Moon },
  { value: 'system', labelEn: 'System', labelAr: 'تلقائي', icon: Monitor },
];

export function TenantBranding({ locale }: TenantBrandingProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { tenant, refresh } = useTenant();
  const [isPending, startTransition] = useTransition();
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(tenant?.theme || 'light');
  const isArabic = locale === 'ar';

  const handleThemeChange = (theme: ThemePreference) => {
    setSelectedTheme(theme);
    startTransition(async () => {
      try {
        const result = await updateTenantAction({ theme });
        if (result.success) {
          toast.success(
            isArabic ? 'تم تحديث المظهر بنجاح' : 'Theme updated successfully'
          );
          refresh();
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Theme update error:', err);
        toast.error(isArabic ? 'حدث خطأ ما' : 'Something went wrong');
      }
    });
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('theme')}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'اختر مظهر واجهة المستخدم المفضل'
              : 'Choose your preferred interface appearance'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  disabled={isPending}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-muted',
                    isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-full p-3',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">
                    {isArabic ? option.labelAr : option.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload (Placeholder - full implementation would need storage integration) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {isArabic ? 'شعار المكتب' : 'Office Logo'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'ارفع شعار مكتبك ليظهر في الفواتير والتقارير'
              : 'Upload your office logo to display on invoices and reports'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isArabic ? 'اسحب وأفلت الشعار هنا' : 'Drag and drop your logo here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isArabic ? 'أو انقر للاختيار (PNG, JPG, SVG)' : 'or click to select (PNG, JPG, SVG)'}
              </p>
            </div>
            <Button variant="outline" disabled>
              <Upload className="me-2 h-4 w-4" />
              {isArabic ? 'اختيار ملف' : 'Choose File'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'الحد الأقصى: 2 ميجابايت' : 'Max size: 2MB'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization (Future Feature) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {isArabic ? 'الألوان المخصصة' : 'Custom Colors'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'تخصيص ألوان العلامة التجارية (قريباً)'
              : 'Customize your brand colors (Coming Soon)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">
                {isArabic ? 'اللون الأساسي' : 'Primary Color'}
              </Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: '#1E5631' }}
                />
                <Input
                  id="primaryColor"
                  value="#1E5631"
                  disabled
                  className="font-mono"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'الأخضر السعودي الداكن' : 'Saudi Deep Green'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">
                {isArabic ? 'اللون المميز' : 'Accent Color'}
              </Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: '#D4AF37' }}
                />
                <Input
                  id="accentColor"
                  value="#D4AF37"
                  disabled
                  className="font-mono"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'الذهبي الخافت' : 'Muted Gold'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'تخصيص الألوان سيكون متاحاً في الإصدار القادم'
                : 'Color customization will be available in the next version'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Branding Preview */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? 'معاينة الفاتورة' : 'Invoice Preview'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'كيف ستظهر فواتيرك للعملاء'
              : 'How your invoices will appear to customers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
            {/* Mini invoice preview */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="h-8 w-24 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {isArabic ? 'الشعار' : 'Logo'}
                  </div>
                  <p className="font-semibold">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tenant.email}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-semibold text-primary">
                    {isArabic ? 'فاتورة' : 'Invoice'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    #INV-2024-0001
                  </p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? 'التاريخ' : 'Date'}
                  </span>
                  <span>2024-01-15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? 'الإجمالي' : 'Total'}
                  </span>
                  <span className="font-medium">SAR 5,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
