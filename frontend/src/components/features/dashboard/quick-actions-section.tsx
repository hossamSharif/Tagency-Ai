'use client';

/**
 * Quick Actions Section Component
 *
 * Section containing quick action cards for the dashboard.
 * Provides shortcuts to common actions: New Invoice, Partner Transaction, Add Expense.
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText, ArrowLeftRight, Receipt } from 'lucide-react';
import { QuickActionCard } from './quick-action-card';
import { PartnerTransactionModal } from './partner-transaction-modal';
import { Separator } from '@/components/ui/separator';
import type { PartnerOffice } from '@/types/models/partner-office';

interface CashBankAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'cash' | 'bank';
}

interface QuickActionsSectionProps {
  partners: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
  }>;
  accounts: CashBankAccount[];
}

export function QuickActionsSection({
  partners,
  accounts,
}: QuickActionsSectionProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('dashboard');

  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Filter to only show active partners
  const activePartners = partners.filter((p) => p.status === 'active');

  const handleNewInvoice = () => {
    router.push(`/${locale}/invoices/new`);
  };

  const handlePartnerTransaction = () => {
    setShowPartnerModal(true);
  };

  const handleAddExpense = () => {
    router.push(`/${locale}/accounting/expenses?openModal=true`);
  };

  const handlePartnerModalClose = () => {
    setShowPartnerModal(false);
  };

  const handlePartnerModalSuccess = () => {
    setShowPartnerModal(false);
    // Optionally refresh the page or show a success indicator
    router.refresh();
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t('quickActions.title')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* New Invoice */}
          <QuickActionCard
            icon={FileText}
            title={t('quickActions.newInvoice.title')}
            description={t('quickActions.newInvoice.description')}
            onClick={handleNewInvoice}
            variant="blue"
          />

          {/* Partner/Agent Transaction */}
          <QuickActionCard
            icon={ArrowLeftRight}
            title={t('quickActions.partnerTransaction.title')}
            description={t('quickActions.partnerTransaction.description')}
            onClick={handlePartnerTransaction}
            variant="emerald"
          />

          {/* Add Expense */}
          <QuickActionCard
            icon={Receipt}
            title={t('quickActions.addExpense.title')}
            description={t('quickActions.addExpense.description')}
            onClick={handleAddExpense}
            variant="amber"
          />
        </div>
      </section>

      {/* Separator after Quick Actions */}
      <Separator className="my-2" />

      {/* Partner Transaction Modal */}
      <PartnerTransactionModal
        open={showPartnerModal}
        onOpenChange={setShowPartnerModal}
        partners={activePartners}
        accounts={accounts}
        locale={locale}
        onSuccess={handlePartnerModalSuccess}
      />
    </>
  );
}

export default QuickActionsSection;
