import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/require-role';
import { ProfileSettingsForm } from '@/components/forms/profile-settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  return {
    title: t('profile'),
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  // Require authentication
  const user = await requireAuth(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('profile')}</p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'قم بتحديث معلومات ملفك الشخصي'
                : 'Update your profile information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm locale={locale} />
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{tAuth('password')}</CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'قم بتغيير كلمة المرور الخاصة بك'
                : 'Change your password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSettingsForm locale={locale} />
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'ar' ? 'التفضيلات' : 'Preferences'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'تخصيص إعدادات اللغة والمظهر'
                : 'Customize your language and theme settings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesSettingsForm locale={locale} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Placeholder components - to be implemented
function PasswordSettingsForm({ locale }: { locale: string }) {
  return (
    <div className="text-muted-foreground text-sm">
      {locale === 'ar' ? 'قريبا...' : 'Coming soon...'}
    </div>
  );
}

function PreferencesSettingsForm({ locale }: { locale: string }) {
  return (
    <div className="text-muted-foreground text-sm">
      {locale === 'ar' ? 'قريبا...' : 'Coming soon...'}
    </div>
  );
}
