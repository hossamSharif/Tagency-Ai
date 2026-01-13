import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StatementsPageClient } from './statements-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t('statements.title'),
    description: t('statements.description'),
  };
}

export default function StatementsPage() {
  return <StatementsPageClient />;
}
