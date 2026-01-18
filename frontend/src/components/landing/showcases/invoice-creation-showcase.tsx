'use client';

/**
 * InvoiceCreationShowcase Component - Slide 2
 *
 * Shows the invoices page, then zooms into one invoice card.
 * Animation sequence (11s loop):
 * 0-1s: Full invoices page appears
 * 1-5s: Stay on full view (user sees the page)
 * 5-6s: Zoom into first invoice card (80% of view)
 * 6-10s: Stay zoomed (user reads invoice details)
 * 10-11s: Zoom out back to full view
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  FileText,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  User,
  Eye,
  Download,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation stages
enum Stage {
  Initial = 0,
  PageAppear = 1,
  FullView = 2,
  ZoomToCard = 3,
  ZoomedView = 4,
  ZoomOut = 5,
}

// Mock invoice data matching the screenshot
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-0001',
    customerName: 'Ahmed Hassan',
    customerNameAr: 'أحمد حسن',
    date: '11 يناير ٢٠٢٦',
    dateEn: '11 Jan 2026',
    servicesCount: 1,
    total: 800.0,
    paid: 800.0,
    balance: 0.0,
    commissions: 80.0,
    status: 'paid' as const,
    statusAr: 'مدفوعة',
    statusEn: 'Paid',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-0002',
    customerName: 'Ahmed Hassan',
    customerNameAr: 'أحمد حسن',
    date: '12 يناير ٢٠٢٦',
    dateEn: '12 Jan 2026',
    servicesCount: 2,
    total: 1039.78,
    paid: 0.0,
    balance: 1039.78,
    commissions: 0,
    status: 'issued' as const,
    statusAr: 'صادرة',
    statusEn: 'Issued',
  },
];

// Stats for bottom bar
const stats = [
  { key: 'cancelled', labelAr: 'ملغاة', labelEn: 'Cancelled', count: 0, color: 'text-red-500' },
  { key: 'paid', labelAr: 'مدفوعة', labelEn: 'Paid', count: 1, color: 'text-green-500' },
  { key: 'partial', labelAr: 'مدفوعة جزئياً', labelEn: 'Partial', count: 0, color: 'text-yellow-500' },
  { key: 'issued', labelAr: 'صادرة', labelEn: 'Issued', count: 1, color: 'text-blue-500' },
  { key: 'draft', labelAr: 'مسودة', labelEn: 'Draft', count: 0, color: 'text-gray-500' },
];

const LOOP_DURATION = 11000;

export function InvoiceCreationShowcase() {
  // Start with PageAppear so content is visible immediately
  const [stage, setStage] = useState<Stage>(Stage.PageAppear);
  const [loopKey, setLoopKey] = useState(0);
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const runAnimationCycle = useCallback(() => {
    clearAllTimers();
    // Start with PageAppear immediately visible (no flash to blank)
    setStage(Stage.PageAppear);
    setLoopKey((prev) => prev + 1);

    const timeline = [
      { stage: Stage.FullView, delay: 900 },
      { stage: Stage.ZoomToCard, delay: 4900 },
      { stage: Stage.ZoomedView, delay: 5900 },
      { stage: Stage.ZoomOut, delay: 9900 },
    ];

    timeline.forEach(({ stage: nextStage, delay }) => {
      const timeout = setTimeout(() => {
        setStage(nextStage);
      }, delay);
      timeoutsRef.current.push(timeout);
    });
  }, [clearAllTimers]);

  useEffect(() => {
    runAnimationCycle();
    const loopInterval = setInterval(runAnimationCycle, LOOP_DURATION);
    return () => {
      clearInterval(loopInterval);
      clearAllTimers();
    };
  }, [runAnimationCycle, clearAllTimers]);

  // Transform based on stage - zoom into first invoice card (right card in RTL)
  const getContainerStyle = () => {
    switch (stage) {
      case Stage.ZoomToCard:
      case Stage.ZoomedView:
        // Zoom to center ONE complete invoice card
        // RTL: first card is on RIGHT, need to shift left (negative x)
        // LTR: first card is on LEFT, need to shift right (positive x)
        return {
          scale: 1.9,
          x: isArabic ? -95 : 95,
          y: -85,
        };
      default:
        return {
          scale: 1,
          x: 0,
          y: 0,
        };
    }
  };

  const containerStyle = getContainerStyle();

  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-lg bg-background/50">
      <AnimatePresence mode="wait">
        {stage >= Stage.PageAppear && (
          <motion.div
            key={`invoices-${loopKey}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{
              opacity: 1,
              y: containerStyle.y,
              x: containerStyle.x,
              scale: containerStyle.scale,
            }}
            transition={{
              opacity: { duration: 0.4 },
              scale: { duration: 0.8, ease: 'easeInOut' },
              x: { duration: 0.8, ease: 'easeInOut' },
              y: { duration: 0.8, ease: 'easeInOut' },
            }}
            className="origin-top px-2"
          >
            {/* INVOICES PAGE REPLICA */}
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {/* Page Header */}
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-bold text-sm">
                        {isArabic ? 'الفواتير' : 'Invoices'}
                      </h2>
                      <p className="text-[10px] text-muted-foreground">
                        {isArabic ? 'عرض وإدارة جميع الفواتير' : 'View and manage all invoices'}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-medium">
                    <Plus className="h-3 w-3" />
                    {isArabic ? 'إنشاء فاتورة' : 'Create Invoice'}
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 border border-border rounded text-[10px] bg-background">
                  <Filter className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isArabic ? 'جميع الحالات' : 'All Status'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 flex items-center gap-1 px-2 py-1 border border-border rounded text-[10px] bg-background">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-[9px]">
                    {isArabic ? 'البحث برقم الفاتورة أو العميل...' : 'Search by invoice or customer...'}
                  </span>
                </div>
              </div>

              {/* Invoice Cards Grid */}
              <div className="p-3 grid grid-cols-2 gap-3">
                {mockInvoices.map((invoice) => (
                  <InvoiceCardMock
                    key={invoice.id}
                    invoice={invoice}
                    isArabic={isArabic}
                  />
                ))}
              </div>

              {/* Bottom Stats Bar */}
              <div className="px-4 py-2 border-t border-border bg-muted/10 flex justify-around">
                {stats.map((stat) => (
                  <div key={stat.key} className="text-center">
                    <div className={cn('text-lg font-bold', stat.color)}>
                      {stat.count}
                    </div>
                    <div className="text-[8px] text-muted-foreground">
                      {isArabic ? stat.labelAr : stat.labelEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Invoice Card Mock Component
interface InvoiceCardMockProps {
  invoice: typeof mockInvoices[0];
  isArabic: boolean;
}

function InvoiceCardMock({ invoice, isArabic }: InvoiceCardMockProps) {
  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {isArabic ? invoice.customerNameAr : invoice.customerName}
              </span>
            </div>
          </div>
          <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-medium', statusColors[invoice.status])}>
            {isArabic ? invoice.statusAr : invoice.statusEn}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-3 py-2 space-y-1.5">
        {/* Date */}
        <div className="flex items-center gap-1 text-[9px]">
          <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isArabic ? 'تاريخ الفاتورة:' : 'Invoice Date:'}
          </span>
          <span className="font-medium">{isArabic ? invoice.date : invoice.dateEn}</span>
        </div>

        {/* Services */}
        <div className="text-[9px]">
          <span className="text-muted-foreground">
            {isArabic ? 'الخدمات:' : 'Services:'}
          </span>
          <span className="font-medium ms-1">
            {invoice.servicesCount} {isArabic ? 'الخدمة' : 'Service'}
          </span>
        </div>

        {/* Amounts */}
        <div className="pt-1.5 border-t border-border space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">{isArabic ? 'الإجمالي:' : 'Total:'}</span>
            <span className="font-semibold">{invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">{isArabic ? 'المدفوع:' : 'Paid:'}</span>
            <span className="text-green-600">{invoice.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">{isArabic ? 'الرصيد المتبقي:' : 'Balance:'}</span>
            <span className={invoice.balance > 0 ? 'text-orange-500 font-medium' : ''}>
              {invoice.balance.toFixed(2)}
            </span>
          </div>
          {invoice.commissions > 0 && (
            <div className="flex justify-between text-[8px] text-muted-foreground pt-1 border-t border-border">
              <span>{isArabic ? 'عمولات الشركاء:' : 'Commissions:'}</span>
              <span>{invoice.commissions.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-3 py-2 border-t border-border flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1 py-1 border border-border rounded text-[9px] bg-background">
          <Eye className="h-3 w-3" />
          {isArabic ? 'عرض' : 'View'}
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-1 border border-border rounded text-[9px] bg-background">
          <Download className="h-3 w-3" />
          {isArabic ? 'تحميل' : 'Download'}
        </button>
      </div>
    </div>
  );
}
