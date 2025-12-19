import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/require-role';
import { CreatePartnerForm } from './create-partner-form';

interface NewPartnerPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewPartnerPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic ? 'إضافة شريك جديد' : 'Add New Partner',
  };
}

export default async function NewPartnerPage({ params }: NewPartnerPageProps) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  // Require admin role
  await requireRole('admin', locale);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isArabic ? 'إضافة شريك جديد' : 'Add New Partner'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? 'أضف مكتب شريك جديد للتعاون معه'
            : 'Add a new partner office to collaborate with'}
        </p>
      </div>

      {/* Form */}
      <div className="border rounded-lg p-6 bg-card">
        <CreatePartnerForm locale={locale} />
      </div>
    </div>
  );
}
