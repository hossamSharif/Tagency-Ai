'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Loader2 } from 'lucide-react';
import { StatementFilters } from '@/components/features/statements/statement-filters';
import { StatementView } from '@/components/features/statements/statement-view';
import {
  getAccountStatement,
  getStatementAccounts,
  AccountStatement,
} from '@/app/actions/statements';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { StatementTemplate } from '@/lib/pdf/statement-template';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StatementsPageClient() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setIsLoadingAccounts(true);
    const result = await getStatementAccounts();
    if (result.success && result.data) {
      setAccounts(result.data);
    } else {
      toast.error(result.error || 'Failed to load accounts');
    }
    setIsLoadingAccounts(false);
  }

  function handleFilterChange(filters: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    if (!filters.accountId) {
      setStatement(null);
      return;
    }

    startTransition(async () => {
      const result = await getAccountStatement({
        accountId: filters.accountId!,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (result.success && result.data) {
        setStatement(result.data);
      } else {
        toast.error(result.error || 'Failed to generate statement');
        setStatement(null);
      }
    });
  }

  async function handleExportPDF() {
    if (!statement) return;

    try {
      setIsGeneratingPDF(true);

      // Get workspace name (you may need to adjust this based on your auth setup)
      const workspaceName = 'Travel Agency'; // TODO: Get from context/settings

      // Generate PDF blob
      const blob = await pdf(
        <StatementTemplate statement={statement} workspaceName={workspaceName} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement-${statement.accountCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('statements.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('statements.pdfGenerationFailed'));
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('statements.title')}
          </h1>
          <p className="text-muted-foreground">{t('statements.description')}</p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          {t('statements.infoMessage')}
        </AlertDescription>
      </Alert>

      {/* Loading State */}
      {isLoadingAccounts && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      {!isLoadingAccounts && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <StatementFilters
              accounts={accounts}
              onFilterChange={handleFilterChange}
              isLoading={isPending}
            />
          </div>

          {/* Statement View */}
          <div className="lg:col-span-2">
            {isPending && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isPending && !statement && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">
                  {t('statements.selectAccountToGenerate')}
                </p>
              </div>
            )}

            {!isPending && statement && (
              <StatementView
                statement={statement}
                onExportPDF={handleExportPDF}
                onPrint={handlePrint}
              />
            )}

            {/* PDF Generation Loading Overlay */}
            {isGeneratingPDF && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {t('statements.generatingPDF')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
