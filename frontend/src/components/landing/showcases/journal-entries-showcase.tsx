'use client';

/**
 * JournalEntriesShowcase Component - Slide 3
 *
 * Shows the journal entries page with filter, totals, and table.
 * Animation sequence (11s loop):
 * 0-0.5s: Page header appears
 * 0.5-1.5s: Filter card slides in from top
 * 1.5-3s: Totals card animates from bottom
 * 3-10s: Table rows appear sequentially
 * 10-11s: Hold complete view
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation stages
enum Stage {
  Initial = 0,
  HeaderAppear = 1,
  FilterAppear = 2,
  TotalsAppear = 3,
  TableAppear = 4,
  RowsAnimate = 5,
  Complete = 6,
}

// Mock journal entries data matching the screenshot
const mockEntries = [
  {
    id: 'JE-2026-0032',
    date: '14 يناير ٢٠٢٦',
    dateEn: '14 Jan 2026',
    type: 'expense',
    typeAr: 'مصروف',
    typeEn: 'Expense',
    description: 'Expense: 8999',
    debit: 8999.07,
    credit: 8999.07,
  },
  {
    id: 'JE-2026-0031',
    date: '13 يناير ٢٠٢٦',
    dateEn: '13 Jan 2026',
    type: 'invoice',
    typeAr: 'إنشاء فاتورة',
    typeEn: 'Invoice Created',
    description: '...ice INV-2026-0002 issued to Ahmed Hassan',
    debit: 1039.78,
    credit: 1039.78,
  },
  {
    id: 'JE-2026-0030',
    date: '13 يناير ٢٠٢٦',
    dateEn: '13 Jan 2026',
    type: 'adjustment',
    typeAr: 'تعديل فاتورة',
    typeEn: 'Invoice Adjusted',
    description: 'Invoice INV-2026-0001 edited - Adjustment',
    debit: 200.00,
    credit: 200.00,
  },
  {
    id: 'JE-2026-0029',
    date: '12 يناير ٢٠٢٦',
    dateEn: '12 Jan 2026',
    type: 'adjustment',
    typeAr: 'تعديل فاتورة',
    typeEn: 'Invoice Adjusted',
    description: 'Invoice INV-2026-0001 edited - Adjustment',
    debit: 200.00,
    credit: 200.00,
  },
  {
    id: 'JE-2026-0028',
    date: '12 يناير ٢٠٢٦',
    dateEn: '12 Jan 2026',
    type: 'partner',
    typeAr: 'دفعة الشريك',
    typeEn: 'Partner Payment',
    description: '...26-0002 to Galaxy Travel Agency (Net: 720)',
    debit: 720.00,
    credit: 720.00,
  },
];

// Totals data
const totals = {
  totalEntries: 7,
  totalDebit: 12758.85,
  totalCredit: 12758.85,
};

const LOOP_DURATION = 11000;

export function JournalEntriesShowcase() {
  // Start with HeaderAppear so content is visible immediately
  const [stage, setStage] = useState<Stage>(Stage.HeaderAppear);
  const [visibleRows, setVisibleRows] = useState<number>(0);
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
    // Start with HeaderAppear immediately visible (no flash to blank)
    setStage(Stage.HeaderAppear);
    setVisibleRows(0);
    setLoopKey((prev) => prev + 1);

    const timeline = [
      { stage: Stage.FilterAppear, delay: 400 },
      { stage: Stage.TotalsAppear, delay: 1400 },
      { stage: Stage.TableAppear, delay: 2900 },
      { stage: Stage.RowsAnimate, delay: 3400 },
      { stage: Stage.Complete, delay: 9900 },
    ];

    timeline.forEach(({ stage: nextStage, delay }) => {
      const timeout = setTimeout(() => {
        setStage(nextStage);

        // Animate rows sequentially
        if (nextStage === Stage.RowsAnimate) {
          mockEntries.forEach((_, index) => {
            const rowTimeout = setTimeout(() => {
              setVisibleRows((prev) => Math.max(prev, index + 1));
            }, index * 400);
            timeoutsRef.current.push(rowTimeout);
          });
        }
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'expense':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'invoice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'adjustment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'partner':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'customer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-lg bg-background/50">
      <AnimatePresence mode="wait">
        {stage >= Stage.HeaderAppear && (
          <motion.div
            key={`journal-${loopKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="px-2"
          >
            {/* JOURNAL ENTRIES PAGE REPLICA */}
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="px-4 py-2 border-b border-border bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <h2 className="font-bold text-xs">
                      {isArabic ? 'قيود اليومية' : 'Journal Entries'}
                    </h2>
                    <p className="text-[9px] text-muted-foreground">
                      {isArabic ? 'عرض جميع المعاملات المالية وقيود اليومية' : 'View all financial transactions and journal entries'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Filter Card */}
              <AnimatePresence>
                {stage >= Stage.FilterAppear && (
                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="px-3 py-2 border-b border-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Filter className="h-3 w-3" />
                        <span>{isArabic ? 'الفلاتر' : 'Filters'}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 border border-border rounded text-[9px] bg-background">
                        <span className="text-muted-foreground">
                          {isArabic ? 'تصفية قيود اليومية حسب التاريخ أو الحساب أو النوع' : 'Filter by date, account or type'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 border border-border rounded text-[9px] bg-background">
                        <span>{isArabic ? 'توسيع' : 'Expand'}</span>
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Totals Card */}
              <AnimatePresence>
                {stage >= Stage.TotalsAppear && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="px-3 py-2 border-b border-border bg-muted/10"
                  >
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <div className="text-[9px] text-muted-foreground">
                          {isArabic ? 'إجمالي القيود' : 'Total Entries'}
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {totals.totalEntries}
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
                        <div className="text-[9px] text-muted-foreground">
                          {isArabic ? 'إجمالي المدين' : 'Total Debit'}
                        </div>
                        <div className="text-sm font-bold">
                          {totals.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                      >
                        <div className="text-[9px] text-muted-foreground">
                          {isArabic ? 'إجمالي الدائن' : 'Total Credit'}
                        </div>
                        <div className="text-sm font-bold">
                          {totals.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table */}
              <AnimatePresence>
                {stage >= Stage.TableAppear && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-1 px-3 py-1.5 bg-muted/30 text-[8px] font-semibold text-muted-foreground border-b border-border">
                      <div className="col-span-2">{isArabic ? 'رقم القيد' : 'Entry #'}</div>
                      <div className="col-span-2">{isArabic ? 'التاريخ' : 'Date'}</div>
                      <div className="col-span-2">{isArabic ? 'نوع الحساب' : 'Type'}</div>
                      <div className="col-span-3">{isArabic ? 'الوصف' : 'Description'}</div>
                      <div className="col-span-1.5 text-end">{isArabic ? 'مدين' : 'Debit'}</div>
                      <div className="col-span-1.5 text-end">{isArabic ? 'دائن' : 'Credit'}</div>
                    </div>

                    {/* Table Rows */}
                    <div className="max-h-[130px] overflow-hidden">
                      {mockEntries.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
                          animate={{
                            opacity: visibleRows > index ? 1 : 0,
                            x: visibleRows > index ? 0 : (isArabic ? 30 : -30),
                          }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className={cn(
                            'grid grid-cols-12 gap-1 px-3 py-1.5 text-[8px] border-b border-border/50',
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                          )}
                        >
                          <div className="col-span-2 font-medium truncate">{entry.id}</div>
                          <div className="col-span-2 text-muted-foreground">
                            {isArabic ? entry.date : entry.dateEn}
                          </div>
                          <div className="col-span-2">
                            <span className={cn('px-1 py-0.5 rounded text-[7px] font-medium', getTypeColor(entry.type))}>
                              {isArabic ? entry.typeAr : entry.typeEn}
                            </span>
                          </div>
                          <div className="col-span-3 text-muted-foreground truncate">
                            {entry.description}
                          </div>
                          <div className="col-span-1.5 text-end font-medium">
                            {entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="col-span-1.5 text-end font-medium">
                            {entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
