import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/require-role';
import { AuditLogsClient } from '@/components/features/audit/audit-logs-client';

interface AuditLogsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AuditLogsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'audit' });

  return {
    title: t('title'),
  };
}

export default async function AuditLogsPage({ params }: AuditLogsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'audit' });

  // Require authentication and admin role
  await requireAuth(locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'تتبع جميع التغييرات والأنشطة في النظام'
            : 'Track all system changes and activities'}
        </p>
      </div>

      {/* Audit Logs Content */}
      <AuditLogsClient />
    </div>
  );
}
