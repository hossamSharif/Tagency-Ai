import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/require-role';
import { TenantSettings } from '@/components/features/settings/tenant-settings';
import { TenantBranding } from '@/components/features/settings/tenant-branding';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Palette, Shield } from 'lucide-react';

interface WorkspaceSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: WorkspaceSettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  return {
    title: t('workspace'),
  };
}

export default async function WorkspaceSettingsPage({ params }: WorkspaceSettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  const isArabic = locale === 'ar';

  // Require owner or admin role to access workspace settings
  await requireRole(locale, ['owner', 'admin']);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('workspace')}</h1>
        <p className="text-muted-foreground">
          {isArabic
            ? 'إدارة إعدادات مساحة العمل والعلامة التجارية'
            : 'Manage workspace settings and branding'}
        </p>
      </div>

      <Separator />

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isArabic ? 'عام' : 'General'}
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {isArabic ? 'العلامة التجارية' : 'Branding'}
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <TenantSettings locale={locale} />
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <TenantBranding locale={locale} />
        </TabsContent>
      </Tabs>

      {/* Danger Zone - Only for owners */}
      <div className="mt-8">
        <Separator className="mb-6" />
        <DangerZone locale={locale} />
      </div>
    </div>
  );
}

/**
 * Danger Zone component for critical workspace actions
 */
function DangerZone({ locale }: { locale: string }) {
  const isArabic = locale === 'ar';

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-destructive/10 p-2">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-destructive">
              {isArabic ? 'منطقة الخطر' : 'Danger Zone'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'الإجراءات التالية لا يمكن التراجع عنها. يرجى التأكد قبل المتابعة.'
                : 'The following actions are irreversible. Please be certain before proceeding.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-destructive/20 bg-background p-4">
            <div>
              <p className="font-medium">
                {isArabic ? 'حذف مساحة العمل' : 'Delete Workspace'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'سيتم حذف جميع البيانات بشكل دائم'
                  : 'All data will be permanently deleted'}
              </p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground opacity-50 cursor-not-allowed"
            >
              {isArabic ? 'حذف مساحة العمل' : 'Delete Workspace'}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {isArabic
              ? 'لحذف مساحة العمل، يرجى التواصل مع الدعم الفني'
              : 'To delete your workspace, please contact support'}
          </p>
        </div>
      </div>
    </div>
  );
}
