'use client';

/**
 * Bank Transfer Instructions Component
 *
 * T204: Displays bank transfer details and proof upload form.
 */

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BANK_TRANSFER_DETAILS, PRICING } from '@/lib/stripe/config';
import { uploadSubscriptionPaymentProofAction } from '@/app/actions/subscriptions';
import {
  Copy,
  Check,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface BankTransferInstructionsProps {
  locale?: 'ar' | 'en';
  paymentId: string;
  reference: string;
  onProofUploaded?: () => void;
}

export function BankTransferInstructions({
  locale = 'en',
  paymentId,
  reference,
  onProofUploaded,
}: BankTransferInstructionsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const isArabic = locale === 'ar';

  const bankDetails = BANK_TRANSFER_DETAILS[isArabic ? 'ar' : 'en'];
  const monthlyPrice = PRICING.monthlyPriceAmount / 100;

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: isArabic
            ? 'حجم الملف يجب أن يكون أقل من 5 ميجابايت'
            : 'File size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: isArabic
            ? 'نوع الملف غير مدعوم. يرجى رفع صورة أو PDF'
            : 'Unsupported file type. Please upload an image or PDF',
          variant: 'destructive',
        });
        return;
      }

      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionRef.trim()) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى إدخال رقم المرجع' : 'Please enter transaction reference',
        variant: 'destructive',
      });
      return;
    }

    if (!proofFile) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى رفع إثبات الدفع' : 'Please upload payment proof',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, you would upload the file to Firebase Storage
      // and get a URL. For now, we'll simulate this.
      const proofUrl = `proof/${paymentId}/${proofFile.name}`;

      const result = await uploadSubscriptionPaymentProofAction(
        {
          paymentId,
          transactionReference: transactionRef,
          bankName: bankName || undefined,
        },
        proofUrl
      );

      if (result.success) {
        toast({
          title: isArabic ? 'تم الرفع بنجاح' : 'Uploaded Successfully',
          description: isArabic
            ? 'سيتم مراجعة طلبك وتفعيل اشتراكك قريباً'
            : 'Your request will be reviewed and your subscription activated soon',
        });

        if (onProofUploaded) {
          onProofUploaded();
        }
      } else {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DetailRow = ({
    label,
    value,
    field,
    showCopy = true,
  }: {
    label: string;
    value: string;
    field: string;
    showCopy?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{value}</span>
        {showCopy && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleCopy(value, field)}
          >
            {copiedField === field ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>{isArabic ? 'تعليمات التحويل البنكي' : 'Bank Transfer Instructions'}</CardTitle>
        </div>
        <CardDescription>
          {isArabic
            ? `قم بتحويل $${monthlyPrice} إلى الحساب التالي`
            : `Transfer $${monthlyPrice} to the following account`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bank Details */}
        <div className="bg-muted/50 rounded-lg p-4">
          <DetailRow label={isArabic ? 'اسم البنك' : 'Bank Name'} value={bankDetails.bankName} field="bank" />
          <DetailRow
            label={isArabic ? 'رقم الحساب' : 'Account Number'}
            value={bankDetails.accountNumber}
            field="account"
          />
          <DetailRow label={isArabic ? 'اسم المستفيد' : 'Account Holder'} value={bankDetails.accountHolder} field="holder" />
          <DetailRow label="IBAN" value={bankDetails.iban} field="iban" />
          <DetailRow label="SWIFT/BIC" value={bankDetails.swiftCode} field="swift" />
          <DetailRow
            label={isArabic ? 'المرجع' : 'Reference'}
            value={reference}
            field="reference"
          />
        </div>

        {/* Important Notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">
              {isArabic ? 'مهم:' : 'Important:'}
            </p>
            <p>{bankDetails.instructions}</p>
          </div>
        </div>

        {/* Proof Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionRef">
              {isArabic ? 'رقم مرجع التحويل' : 'Transaction Reference Number'}
            </Label>
            <Input
              id="transactionRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder={isArabic ? 'أدخل رقم المرجع من البنك' : 'Enter reference number from your bank'}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">{isArabic ? 'اسم البنك المرسل (اختياري)' : 'Sending Bank Name (optional)'}</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={isArabic ? 'اسم البنك الذي قمت بالتحويل منه' : 'Name of bank you transferred from'}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>{isArabic ? 'إثبات الدفع' : 'Payment Proof'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                proofFile ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {proofFile ? (
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                  <FileText className="h-5 w-5" />
                  <span>{proofFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? 'انقر لرفع صورة أو PDF لإثبات التحويل'
                      : 'Click to upload an image or PDF of your transfer receipt'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !transactionRef || !proofFile}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin me-2" />
              {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
            </>
          ) : (
            isArabic ? 'إرسال إثبات الدفع' : 'Submit Payment Proof'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
