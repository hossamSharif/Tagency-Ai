'use client';

/**
 * DashboardShowcase Component - Slide 4
 *
 * Shows the dashboard overview with stats, charts, and activity.
 * Animation sequence (11s loop):
 * 0-0.5s: Header appears
 * 0.5-2s: Stats cards animate with stagger
 * 2-3.5s: Chart section fades in with animated bars
 * 3.5-5s: Activity items appear sequentially
 * 5-6.5s: Services section animates
 * 6.5-11s: Hold complete view
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation stages
enum Stage {
  Initial = 0,
  HeaderAppear = 1,
  StatsAppear = 2,
  ChartAppear = 3,
  ActivityAppear = 4,
  ServicesAppear = 5,
  Complete = 6,
}

// Mock stats data
const statsCards = [
  {
    id: 'services',
    icon: Package,
    valueAr: '12',
    valueEn: '12',
    labelAr: 'الخدمات النشطة',
    labelEn: 'Active Services',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'customers',
    icon: Users,
    valueAr: '48',
    valueEn: '48',
    labelAr: 'إجمالي العملاء',
    labelEn: 'Total Customers',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    id: 'groups',
    icon: TrendingUp,
    valueAr: '5',
    valueEn: '5',
    labelAr: 'المجموعات النشطة',
    labelEn: 'Active Groups',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'revenue',
    icon: DollarSign,
    valueAr: '24,580',
    valueEn: '24,580',
    labelAr: 'إجمالي الإيرادات',
    labelEn: 'Total Revenue',
    suffix: 'ر.س',
    suffixEn: 'SAR',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

// Mock chart data (monthly revenue)
const chartData = [
  { month: 'يناير', monthEn: 'Jan', value: 4200 },
  { month: 'فبراير', monthEn: 'Feb', value: 3800 },
  { month: 'مارس', monthEn: 'Mar', value: 5100 },
  { month: 'أبريل', monthEn: 'Apr', value: 4600 },
  { month: 'مايو', monthEn: 'May', value: 6200 },
  { month: 'يونيو', monthEn: 'Jun', value: 5800 },
];

// Mock recent activity
const recentActivity = [
  {
    id: '1',
    type: 'invoice',
    icon: FileText,
    textAr: 'فاتورة جديدة INV-2026-0015',
    textEn: 'New invoice INV-2026-0015',
    amountAr: '1,250 ر.س',
    amountEn: '1,250 SAR',
    timeAr: 'منذ 5 دقائق',
    timeEn: '5 min ago',
    color: 'text-blue-600',
  },
  {
    id: '2',
    type: 'payment',
    icon: CreditCard,
    textAr: 'دفعة من أحمد حسن',
    textEn: 'Payment from Ahmed Hassan',
    amountAr: '800 ر.س',
    amountEn: '800 SAR',
    timeAr: 'منذ 15 دقيقة',
    timeEn: '15 min ago',
    color: 'text-green-600',
  },
  {
    id: '3',
    type: 'customer',
    icon: Users,
    textAr: 'عميل جديد: محمد علي',
    textEn: 'New customer: Mohammed Ali',
    amountAr: '',
    amountEn: '',
    timeAr: 'منذ ساعة',
    timeEn: '1 hour ago',
    color: 'text-purple-600',
  },
];

// Mock top services
const topServices = [
  { nameAr: 'عمرة رمضان', nameEn: 'Ramadan Umrah', count: 24, percent: 40 },
  { nameAr: 'حج مبرور', nameEn: 'Hajj Premium', count: 18, percent: 30 },
  { nameAr: 'عمرة اقتصادية', nameEn: 'Economy Umrah', count: 12, percent: 20 },
  { nameAr: 'شهر عسل', nameEn: 'Honeymoon', count: 6, percent: 10 },
];

const LOOP_DURATION = 11000;

export function DashboardShowcase() {
  // Start with HeaderAppear so content is visible immediately
  const [stage, setStage] = useState<Stage>(Stage.HeaderAppear);
  const [visibleStats, setVisibleStats] = useState<number>(0);
  const [visibleActivity, setVisibleActivity] = useState<number>(0);
  const [chartAnimated, setChartAnimated] = useState(false);
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
    setVisibleStats(0);
    setVisibleActivity(0);
    setChartAnimated(false);
    setLoopKey((prev) => prev + 1);

    const timeline = [
      { stage: Stage.StatsAppear, delay: 400 },
      { stage: Stage.ChartAppear, delay: 1900 },
      { stage: Stage.ActivityAppear, delay: 3400 },
      { stage: Stage.ServicesAppear, delay: 4900 },
      { stage: Stage.Complete, delay: 6400 },
    ];

    timeline.forEach(({ stage: nextStage, delay }) => {
      const timeout = setTimeout(() => {
        setStage(nextStage);

        // Animate stats cards sequentially
        if (nextStage === Stage.StatsAppear) {
          statsCards.forEach((_, index) => {
            const statTimeout = setTimeout(() => {
              setVisibleStats((prev) => Math.max(prev, index + 1));
            }, index * 200);
            timeoutsRef.current.push(statTimeout);
          });
        }

        // Animate chart bars
        if (nextStage === Stage.ChartAppear) {
          const chartTimeout = setTimeout(() => {
            setChartAnimated(true);
          }, 300);
          timeoutsRef.current.push(chartTimeout);
        }

        // Animate activity items
        if (nextStage === Stage.ActivityAppear) {
          recentActivity.forEach((_, index) => {
            const activityTimeout = setTimeout(() => {
              setVisibleActivity((prev) => Math.max(prev, index + 1));
            }, index * 300);
            timeoutsRef.current.push(activityTimeout);
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

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-lg bg-background/50">
      <AnimatePresence mode="wait">
        {stage >= Stage.HeaderAppear && (
          <motion.div
            key={`dashboard-${loopKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="px-2"
          >
            {/* DASHBOARD PAGE REPLICA */}
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="px-3 py-2 border-b border-border bg-gradient-to-r from-primary/5 to-transparent"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs">
                      {isArabic ? 'لوحة المعلومات' : 'Dashboard'}
                    </h2>
                    <p className="text-[8px] text-muted-foreground">
                      {isArabic ? 'نظرة عامة على أداء عملك' : 'Overview of your business performance'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-4 gap-2">
                  {statsCards.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{
                        opacity: visibleStats > index ? 1 : 0,
                        y: visibleStats > index ? 0 : -20,
                        scale: visibleStats > index ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="bg-muted/30 rounded-lg p-2 border border-border/50"
                    >
                      <div className={cn('p-1 rounded w-fit', stat.bgColor)}>
                        <stat.icon className={cn('h-3 w-3', stat.color)} />
                      </div>
                      <div className="mt-1">
                        <div className="text-sm font-bold">
                          {isArabic ? stat.valueAr : stat.valueEn}
                          {stat.suffix && (
                            <span className="text-[8px] font-normal text-muted-foreground ms-0.5">
                              {isArabic ? stat.suffix : stat.suffixEn}
                            </span>
                          )}
                        </div>
                        <div className="text-[7px] text-muted-foreground truncate">
                          {isArabic ? stat.labelAr : stat.labelEn}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="px-3 pb-2 grid grid-cols-2 gap-2">
                {/* Chart Section */}
                <AnimatePresence>
                  {stage >= Stage.ChartAppear && (
                    <motion.div
                      initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-muted/20 rounded-lg p-2 border border-border/50"
                    >
                      <div className="text-[8px] font-semibold mb-2">
                        {isArabic ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
                      </div>
                      {/* Mini Bar Chart */}
                      <div className="flex items-end justify-between h-[60px] gap-1">
                        {chartData.map((data, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <motion.div
                              className="w-full bg-primary/80 rounded-t"
                              initial={{ height: 0 }}
                              animate={{
                                height: chartAnimated
                                  ? `${(data.value / maxChartValue) * 50}px`
                                  : 0,
                              }}
                              transition={{
                                duration: 0.6,
                                delay: index * 0.1,
                                ease: 'easeOut',
                              }}
                            />
                            <span className="text-[6px] text-muted-foreground mt-1">
                              {isArabic ? data.month.slice(0, 3) : data.monthEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recent Activity */}
                <AnimatePresence>
                  {stage >= Stage.ActivityAppear && (
                    <motion.div
                      initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-muted/20 rounded-lg p-2 border border-border/50"
                    >
                      <div className="text-[8px] font-semibold mb-1.5">
                        {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
                      </div>
                      <div className="space-y-1.5">
                        {recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: isArabic ? -10 : 10 }}
                            animate={{
                              opacity: visibleActivity > index ? 1 : 0,
                              x: visibleActivity > index ? 0 : (isArabic ? -10 : 10),
                            }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-1.5"
                          >
                            <div className={cn('p-1 rounded', activity.color.replace('text-', 'bg-').replace('600', '100'))}>
                              <activity.icon className={cn('h-2.5 w-2.5', activity.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[7px] font-medium truncate">
                                {isArabic ? activity.textAr : activity.textEn}
                              </div>
                              <div className="text-[6px] text-muted-foreground">
                                {isArabic ? activity.timeAr : activity.timeEn}
                              </div>
                            </div>
                            {activity.amountAr && (
                              <div className="text-[7px] font-semibold text-green-600">
                                {isArabic ? activity.amountAr : activity.amountEn}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Top Services Section */}
              <AnimatePresence>
                {stage >= Stage.ServicesAppear && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="px-3 pb-2"
                  >
                    <div className="bg-muted/20 rounded-lg p-2 border border-border/50">
                      <div className="text-[8px] font-semibold mb-1.5">
                        {isArabic ? 'الخدمات الأكثر طلباً' : 'Top Services'}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {topServices.map((service, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            className="flex items-center gap-1.5"
                          >
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[7px] truncate">
                                  {isArabic ? service.nameAr : service.nameEn}
                                </span>
                                <span className="text-[7px] font-semibold">{service.count}</span>
                              </div>
                              <div className="h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                                <motion.div
                                  className="h-full bg-primary rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${service.percent}%` }}
                                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
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
