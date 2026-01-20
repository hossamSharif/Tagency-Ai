import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { PartnerList } from './partner-list';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeftRight } from 'lucide-react';

interface PartnersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PartnersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partners' });

  return {
    title: t('title'),
  };
}

export default async function PartnersPage({ params }: PartnersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tEntries = await getTranslations({ locale, namespace: 'partnerEntries' });
  const isArabic = locale === 'ar';

  // Require admin role for partner management
  await requireRole('admin', locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/partner-entries`}>
              <ArrowLeftRight className="me-2 h-4 w-4" />
              {isArabic ? 'حركات الحسابات' : 'Account Entries'}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/partners/new`}>
              <Plus className="me-2 h-4 w-4" />
              {t('create')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Partner List */}
      <PartnerList locale={locale} />
    </div>
  );
}
