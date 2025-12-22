'use client';

/**
 * Invoice Detail Client Component
 * T042 [US1] Enhance invoice detail page - Client interactivity
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetail } from '@/components/features/invoices/invoice-detail';
import { Invoice } from '@/types/models/invoice';
import {
  issueServiceInvoice,
  cancelServiceInvoice,
  updateServiceInvoice,
} from '@/app/actions/invoices';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceDetailClientProps {
  invoice: Invoice;
  locale: string;
}

export function InvoiceDetailClient({ invoice: initialInvoice, locale }: InvoiceDetailClientProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  function handleEdit() {
    router.push(`/${locale}/invoices/${invoice.id}/edit`);
  }

  function handleIssue() {
    startTransition(async () => {
      try {
        const result = await issueServiceInvoice(invoice.id);

        if (result.success && result.data) {
          setInvoice(result.data);
          toast({
            title: t('invoices.issueSuccess'),
            description: t('invoices.issueSuccessDescription', {
              invoiceNumber: result.data.invoiceNumber,
            }),
          });
          router.refresh();
        } else {
          toast({
            title: t('common.error'),
            description: result.error || t('invoices.issueError'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error issuing invoice:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.issueError'),
          variant: 'destructive',
        });
      }
    });
  }

  async function handleCancelConfirm() {
    if (!cancelReason.trim()) {
      toast({
        title: t('common.error'),
        description: t('invoices.cancelReasonRequired'),
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await cancelServiceInvoice(invoice.id, cancelReason);

        if (result.success && result.data) {
          setInvoice(result.data);
          toast({
            title: t('invoices.cancelSuccess'),
            description: t('invoices.cancelSuccessDescription'),
          });
          setShowCancelDialog(false);
          setCancelReason('');
          router.refresh();
        } else {
          toast({
            title: t('common.error'),
            description: result.error || t('invoices.cancelError'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error cancelling invoice:', error);
        toast({
          title: t('common.error'),
          description: t('invoices.cancelError'),
          variant: 'destructive',
        });
      }
    });
  }

  async function handleDownload() {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('invoices.downloadSuccess'),
        description: t('invoices.downloadSuccessDescription'),
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: t('common.error'),
        description: t('invoices.downloadError'),
        variant: 'destructive',
      });
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/${locale}/invoices`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('invoices.invoiceDetails')}</h1>
            <p className="text-muted-foreground">{t('invoices.viewInvoiceDescription')}</p>
          </div>
        </div>

        {/* Invoice Detail */}
        <InvoiceDetail
          invoice={invoice}
          onEdit={invoice.status === 'draft' ? handleEdit : undefined}
          onIssue={invoice.status === 'draft' ? handleIssue : undefined}
          onCancel={
            invoice.status !== 'cancelled' && invoice.status !== 'paid'
              ? () => setShowCancelDialog(true)
              : undefined
          }
          onDownload={invoice.status !== 'draft' ? handleDownload : undefined}
        />
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoices.cancelInvoice')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('invoices.cancelInvoiceWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">{t('invoices.cancelReason')}</Label>
              <Input
                id="cancelReason"
                placeholder={t('invoices.cancelReasonPlaceholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isPending || !cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('invoices.confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
