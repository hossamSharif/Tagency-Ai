'use client';

/**
 * Partner Entries Page Client Component
 *
 * Interactive component for managing partner account entries
 */

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Building2, ArrowLeftRight } from 'lucide-react';
import {
  PartnerBalanceDisplay,
  PartnerEntryForm,
  PartnerEntriesTable,
  CancelEntryDialog,
} from '@/components/features/partner-entries';
import {
  createPartnerEntryAction,
  getPartnerBalanceAction,
  getPartnerEntriesAction,
  cancelPartnerEntryAction,
  type PartnerEntry,
} from '@/app/actions/partner-entries';
import type { CreatePartnerEntryInput } from '@/lib/validations/partner-entries';

interface Partner {
  id: string;
  name: string;
  code: string;
}

interface CashBankAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'cash' | 'bank';
}

interface PartnerEntriesPageClientProps {
  locale: string;
  partners: Partner[];
  accounts: CashBankAccount[];
}

export function PartnerEntriesPageClient({
  locale,
  partners,
  accounts,
}: PartnerEntriesPageClientProps) {
  const t = useTranslations('partnerEntries');
  const tCommon = useTranslations('common');
  const isArabic = locale === 'ar';

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [entries, setEntries] = useState<PartnerEntry[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCancelling, setIsCancelling] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<PartnerEntry | null>(null);

  // Fetch partner balance and entries when partner is selected
  useEffect(() => {
    if (!selectedPartnerId) {
      setBalance(0);
      setEntries([]);
      return;
    }

    const fetchPartnerData = async () => {
      setIsLoadingBalance(true);
      setIsLoadingEntries(true);

      try {
        // Fetch balance and entries in parallel
        const [balanceResult, entriesResult] = await Promise.all([
          getPartnerBalanceAction(selectedPartnerId),
          getPartnerEntriesAction(selectedPartnerId, { limit: 20 }),
        ]);

        if (balanceResult.success) {
          setBalance(balanceResult.data.balance);
        } else {
          toast.error(balanceResult.error);
        }

        if (entriesResult.success) {
          setEntries(entriesResult.data);
        } else {
          toast.error(entriesResult.error);
        }
      } catch (error) {
        toast.error(isArabic ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
      } finally {
        setIsLoadingBalance(false);
        setIsLoadingEntries(false);
      }
    };

    fetchPartnerData();
  }, [selectedPartnerId, isArabic]);

  // Handle form submission
  const handleSubmit = async (data: CreatePartnerEntryInput) => {
    startTransition(async () => {
      try {
        const result = await createPartnerEntryAction(data);

        if (result.success) {
          toast.success(result.message || t('successCreated'));

          // Update balance with new value
          setBalance(result.data.newBalance);

          // Refresh entries list
          const entriesResult = await getPartnerEntriesAction(selectedPartnerId, { limit: 20 });
          if (entriesResult.success) {
            setEntries(entriesResult.data);
          }
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error(isArabic ? 'حدث خطأ أثناء إنشاء العملية' : 'Error creating entry');
      }
    });
  };

  // Handle cancel entry
  const handleCancelEntry = async (entryId: string, reason: string) => {
    setIsCancelling(true);
    try {
      const result = await cancelPartnerEntryAction({
        entryId,
        partnerId: selectedPartnerId,
        reason,
      });

      if (result.success) {
        toast.success(t('successCancelled'));

        // Update balance with new value
        setBalance(result.data.newBalance);

        // Refresh entries list
        const entriesResult = await getPartnerEntriesAction(selectedPartnerId, { limit: 20 });
        if (entriesResult.success) {
          setEntries(entriesResult.data);
        }

        setEntryToCancel(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ أثناء إلغاء العملية' : 'Error cancelling entry');
    } finally {
      setIsCancelling(false);
    }
  };

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isArabic
            ? 'إدارة حركات حسابات الشركاء (السلف والسحوبات)'
            : 'Manage partner account entries (prepayments and withdrawals)'}
        </p>
      </div>

      {/* Partner Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('selectPartner')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder={isArabic ? 'اختر الشريك...' : 'Select partner...'} />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.code} - {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Balance Display */}
          {selectedPartnerId && (
            <div className="mt-4">
              <PartnerBalanceDisplay
                balance={balance}
                isLoading={isLoadingBalance}
                locale={locale}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Form and Recent Entries - Show only when partner is selected */}
      {selectedPartnerId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'إضافة عملية جديدة' : 'Add New Entry'}</CardTitle>
              <CardDescription>
                {isArabic
                  ? `إضافة سلفة أو سحب لـ ${selectedPartner?.name}`
                  : `Add prepayment or withdrawal for ${selectedPartner?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartnerEntryForm
                partnerId={selectedPartnerId}
                accounts={accounts}
                onSubmit={handleSubmit}
                isLoading={isPending}
                locale={locale}
              />
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recentEntries')}</CardTitle>
              <CardDescription>
                {isArabic
                  ? `آخر العمليات لـ ${selectedPartner?.name}`
                  : `Recent entries for ${selectedPartner?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartnerEntriesTable
                entries={entries}
                isLoading={isLoadingEntries}
                locale={locale}
                onCancelEntry={(entry) => setEntryToCancel(entry)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Entry Dialog */}
      <CancelEntryDialog
        entry={entryToCancel}
        isOpen={!!entryToCancel}
        onClose={() => setEntryToCancel(null)}
        onConfirm={handleCancelEntry}
        isLoading={isCancelling}
        locale={locale}
      />

      {/* Empty State when no partner selected */}
      {!selectedPartnerId && (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {isArabic ? 'اختر شريكاً للبدء' : 'Select a partner to begin'}
            </p>
            <p>
              {isArabic
                ? 'اختر شريكاً من القائمة أعلاه لعرض الرصيد وإضافة عمليات جديدة'
                : 'Choose a partner from the list above to view balance and add new entries'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PartnerEntriesPageClient;
