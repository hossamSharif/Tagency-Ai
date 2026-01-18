'use client';

/**
 * PassportScanShowcase Component - Slide 1
 *
 * EXACT REPLICA of the CustomerForm component with animated showcase.
 * Animation sequence (11s loop - slider rotates every 12s):
 * 0-1s: Full CustomerForm card appears from top
 * 1-2.5s: Gentle zoom into passport scanner camera area
 * 2.5-4.5s: Horizontal scan line sweeps (flash effect)
 * 4.5-5.5s: Scroll/pan down to form fields
 * 5.5-9s: Auto-fill fields sequentially with highlight
 * 9-10s: Button click animation (pulse + glow)
 * 10-11s: Zoom out to show complete filled form
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Camera,
  User,
  Save,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation stages
enum Stage {
  Initial = 0,
  ModalAppear = 1,
  ZoomToCamera = 2,
  Scanning = 3,
  ScrollToForm = 4,
  AutoFill = 5,
  ButtonClick = 6,
  ZoomOut = 7,
  Complete = 8,
}

// Mock customer data for auto-fill
const mockCustomerData = {
  firstName: 'Ahmed',
  firstNameAr: 'أحمد',
  lastName: 'Hassan',
  lastNameAr: 'حسن',
  email: 'ahmed.hassan@email.com',
  phone: '+966 50 123 4567',
  nationality: 'Saudi Arabia',
  nationalityAr: 'السعودية',
  passportNumber: 'A12345678',
  nationalId: '1087654321',
  city: 'Riyadh',
  cityAr: 'الرياض',
  country: 'Saudi Arabia',
  countryAr: 'المملكة العربية السعودية',
};

// Total loop duration: 11 seconds (slider rotates every 12s)
const LOOP_DURATION = 11000;

export function PassportScanShowcase() {
  // Start with ModalAppear so content is visible immediately
  const [stage, setStage] = useState<Stage>(Stage.ModalAppear);
  const [filledFields, setFilledFields] = useState<string[]>([]);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [loopKey, setLoopKey] = useState(0);
  const [scannerExpanded, setScannerExpanded] = useState(false);

  const t = useTranslations('landing.hero.showcase.passportScan');
  const locale = useLocale();
  const isArabic = locale === 'ar';

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts and intervals
  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  // Run single animation cycle
  const runAnimationCycle = useCallback(() => {
    clearAllTimers();

    // Reset all state - start with ModalAppear immediately visible (no flash to blank)
    setStage(Stage.ModalAppear);
    setFilledFields([]);
    setScanLinePosition(0);
    setScannerExpanded(false);
    setLoopKey((prev) => prev + 1);

    // Animation timeline - extended for full visibility
    const timeline = [
      { stage: Stage.ZoomToCamera, delay: 900 },
      { stage: Stage.Scanning, delay: 2400 },
      { stage: Stage.ScrollToForm, delay: 4400 },
      { stage: Stage.AutoFill, delay: 5400 },
      { stage: Stage.ButtonClick, delay: 8900 },
      { stage: Stage.ZoomOut, delay: 9900 },
      { stage: Stage.Complete, delay: 10400 },
    ];

    timeline.forEach(({ stage: nextStage, delay }) => {
      const timeout = setTimeout(() => {
        setStage(nextStage);

        // Expand scanner when zooming to camera
        if (nextStage === Stage.ZoomToCamera) {
          setScannerExpanded(true);
        }

        // Start scan line animation (2 seconds duration)
        if (nextStage === Stage.Scanning) {
          setScanLinePosition(0);
          scanIntervalRef.current = setInterval(() => {
            setScanLinePosition((prev) => {
              if (prev >= 100) {
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current);
                  scanIntervalRef.current = null;
                }
                return 100;
              }
              return prev + 2.5;
            });
          }, 40);
        }

        // Auto-fill fields sequentially (8 fields, fast ~200ms each)
        if (nextStage === Stage.AutoFill) {
          const fields = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'passportNumber',
            'nationality',
            'city',
            'country',
          ];
          fields.forEach((field, index) => {
            const fieldTimeout = setTimeout(() => {
              setFilledFields((prev) => [...prev, field]);
            }, index * 200);
            timeoutsRef.current.push(fieldTimeout);
          });
        }
      }, delay);

      timeoutsRef.current.push(timeout);
    });
  }, [clearAllTimers]);

  // Animation loop
  useEffect(() => {
    runAnimationCycle();

    const loopInterval = setInterval(() => {
      runAnimationCycle();
    }, LOOP_DURATION);

    return () => {
      clearInterval(loopInterval);
      clearAllTimers();
    };
  }, [runAnimationCycle, clearAllTimers]);

  // Calculate transform - NO ZOOM, only scroll (Y translation)
  const getContainerStyle = () => {
    switch (stage) {
      case Stage.ZoomToCamera:
      case Stage.Scanning:
        // No zoom - card stays at normal size, passport scanner visible at top
        return {
          scale: 1,
          y: 0,
        };
      case Stage.ScrollToForm:
      case Stage.AutoFill:
      case Stage.ButtonClick:
        // Scroll down more to show ALL form fields
        return {
          scale: 1,
          y: -300,
        };
      case Stage.ZoomOut:
      case Stage.Complete:
        // Back to top - show full card
        return {
          scale: 1,
          y: 0,
        };
      default:
        return {
          scale: 1,
          y: 0,
        };
    }
  };

  const containerStyle = getContainerStyle();

  return (
    <div className="relative w-full h-[360px] overflow-hidden rounded-lg bg-background/50">
      <AnimatePresence mode="wait">
        {stage >= Stage.ModalAppear && (
          <motion.div
            key={`form-${loopKey}`}
            initial={{ opacity: 0, y: -80, scale: 1 }}
            animate={{
              opacity: 1,
              y: containerStyle.y,
              scale: containerStyle.scale,
            }}
            transition={{
              opacity: { duration: 0.4 },
              scale: { duration: 0.7, ease: 'easeInOut' },
              y: { duration: 0.7, ease: 'easeInOut' },
            }}
            className="origin-top px-3"
          >
            {/* CUSTOMER FORM CARD REPLICA */}
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {isArabic ? 'إنشاء عميل' : 'Create Customer'}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-4">
                {/* PASSPORT SCANNER SECTION */}
                <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg overflow-hidden">
                  {/* Collapsible Header */}
                  <button className="w-full px-3 py-2.5 flex items-center justify-between text-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {isArabic ? 'مسح جواز السفر (اختياري)' : 'Scan Passport (Optional)'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isArabic ? 'تعبئة تلقائية من جواز السفر' : 'Auto-fill customer data from passport'}
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: scannerExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* Scanner Content - Animated Expand */}
                  <AnimatePresence>
                    {scannerExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          {/* CAMERA VIEWFINDER - Compact height */}
                          <div className="relative aspect-[2/1] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                            {/* Passport Document Mock */}
                            <div className="absolute inset-4 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-md border-2 border-yellow-600/50 flex flex-col items-center justify-center shadow-lg">
                              <div className="text-[10px] font-bold text-yellow-400/90 tracking-[0.2em] mb-2">
                                PASSPORT
                              </div>
                              <div className="w-12 h-14 bg-gray-200/30 rounded-sm mb-2" />
                              <div className="text-[8px] text-yellow-400/70 tracking-wide">
                                {isArabic ? 'جواز سفر' : 'TRAVEL DOCUMENT'}
                              </div>
                            </div>

                            {/* Dashed Scanning Frame */}
                            <div className="absolute inset-3 border-2 border-dashed border-white/60 rounded-md pointer-events-none" />

                            {/* Corner Markers */}
                            <div className="absolute top-3 left-3 w-6 h-6 border-t-3 border-l-3 border-green-400 rounded-tl" />
                            <div className="absolute top-3 right-3 w-6 h-6 border-t-3 border-r-3 border-green-400 rounded-tr" />
                            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-3 border-l-3 border-green-400 rounded-bl" />
                            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-3 border-r-3 border-green-400 rounded-br" />

                            {/* SCANNING LINE */}
                            {stage === Stage.Scanning && (
                              <motion.div
                                className="absolute left-3 right-3 h-1 rounded-full"
                                style={{
                                  top: `${12 + scanLinePosition * 0.76}%`,
                                  background: 'linear-gradient(90deg, transparent 0%, #4ade80 30%, #22c55e 50%, #4ade80 70%, transparent 100%)',
                                  boxShadow: '0 0 20px 4px rgba(74, 222, 128, 0.9), 0 0 40px 8px rgba(74, 222, 128, 0.4)',
                                }}
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 0.2, repeat: Infinity }}
                              />
                            )}

                            {/* Scan Complete Overlay */}
                            {stage >= Stage.ScrollToForm && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-green-500/25 flex items-center justify-center"
                              >
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                  className="bg-green-500 rounded-full p-2 shadow-lg"
                                >
                                  <CheckCircle className="h-8 w-8 text-white" />
                                </motion.div>
                              </motion.div>
                            )}
                          </div>

                          {/* Camera Action Buttons */}
                          <div className="flex gap-2">
                            <div className="flex-1 py-2 text-xs text-center border border-border rounded-md bg-background text-muted-foreground font-medium">
                              {isArabic ? 'إلغاء' : 'Cancel'}
                            </div>
                            <div className="flex-1 py-2 text-xs text-center bg-primary text-primary-foreground rounded-md font-medium flex items-center justify-center gap-1.5">
                              <Camera className="h-3.5 w-3.5" />
                              {isArabic ? 'التقاط' : 'Capture'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* FORM FIELDS SECTION */}
                <div className="space-y-3">
                  {/* Row 1: First Name, Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormFieldMock
                      label={isArabic ? 'الاسم الأول' : 'First Name'}
                      value={isArabic ? mockCustomerData.firstNameAr : mockCustomerData.firstName}
                      isFilled={filledFields.includes('firstName')}
                      placeholder={isArabic ? 'أدخل الاسم' : 'Enter first name'}
                    />
                    <FormFieldMock
                      label={isArabic ? 'الاسم الأخير' : 'Last Name'}
                      value={isArabic ? mockCustomerData.lastNameAr : mockCustomerData.lastName}
                      isFilled={filledFields.includes('lastName')}
                      placeholder={isArabic ? 'أدخل الاسم' : 'Enter last name'}
                    />
                  </div>

                  {/* Row 2: Email, Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormFieldMock
                      label={isArabic ? 'البريد الإلكتروني' : 'Email'}
                      value={mockCustomerData.email}
                      isFilled={filledFields.includes('email')}
                      placeholder="email@example.com"
                    />
                    <FormFieldMock
                      label={isArabic ? 'رقم الهاتف' : 'Phone'}
                      value={mockCustomerData.phone}
                      isFilled={filledFields.includes('phone')}
                      placeholder="+966 5x xxx xxxx"
                    />
                  </div>

                  {/* Row 3: Passport Number, Nationality */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormFieldMock
                      label={isArabic ? 'رقم جواز السفر' : 'Passport Number'}
                      value={mockCustomerData.passportNumber}
                      isFilled={filledFields.includes('passportNumber')}
                      placeholder={isArabic ? 'رقم الجواز' : 'Passport no.'}
                    />
                    <FormFieldMock
                      label={isArabic ? 'الجنسية' : 'Nationality'}
                      value={isArabic ? mockCustomerData.nationalityAr : mockCustomerData.nationality}
                      isFilled={filledFields.includes('nationality')}
                      placeholder={isArabic ? 'اختر الدولة' : 'Select country'}
                      isSelect
                    />
                  </div>

                  {/* Row 4: City, Country */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormFieldMock
                      label={isArabic ? 'المدينة' : 'City'}
                      value={isArabic ? mockCustomerData.cityAr : mockCustomerData.city}
                      isFilled={filledFields.includes('city')}
                      placeholder={isArabic ? 'المدينة' : 'City'}
                    />
                    <FormFieldMock
                      label={isArabic ? 'الدولة' : 'Country'}
                      value={isArabic ? mockCustomerData.countryAr : mockCustomerData.country}
                      isFilled={filledFields.includes('country')}
                      placeholder={isArabic ? 'الدولة' : 'Country'}
                    />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-3 border-t border-border">
                  <div className="flex-1 py-2.5 text-sm text-center border border-border rounded-md bg-background text-muted-foreground font-medium">
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </div>
                  <motion.div
                    className={cn(
                      'flex-1 py-2.5 text-sm text-center rounded-md font-semibold flex items-center justify-center gap-2',
                      stage === Stage.Complete
                        ? 'bg-green-600 text-white'
                        : 'bg-primary text-primary-foreground'
                    )}
                    animate={
                      stage === Stage.ButtonClick
                        ? {
                            scale: [1, 0.9, 1.02, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(30, 86, 49, 0)',
                              '0 0 0 8px rgba(30, 86, 49, 0.5)',
                              '0 0 0 4px rgba(30, 86, 49, 0.3)',
                              '0 0 0 0 rgba(30, 86, 49, 0)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.6 }}
                  >
                    {stage === Stage.Complete ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {isArabic ? 'تم الإنشاء!' : 'Created!'}
                      </>
                    ) : stage === Stage.ButtonClick ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {isArabic ? 'إنشاء عميل' : 'Create Customer'}
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Form Field Mock Component with fill animation
interface FormFieldMockProps {
  label: string;
  value: string;
  isFilled: boolean;
  placeholder: string;
  isSelect?: boolean;
}

function FormFieldMock({
  label,
  value,
  isFilled,
  placeholder,
  isSelect,
}: FormFieldMockProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <motion.div
        className={cn(
          'w-full h-9 px-3 rounded-md border text-sm flex items-center',
          isFilled
            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/40'
            : 'border-input bg-background text-muted-foreground/60'
        )}
        animate={
          isFilled
            ? {
                scale: [1, 1.02, 1],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        {isFilled ? (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="text-foreground font-medium truncate"
          >
            {value}
          </motion.span>
        ) : (
          <span className="truncate">{placeholder}</span>
        )}
        {isSelect && !isFilled && (
          <ChevronDown className="h-4 w-4 ms-auto text-muted-foreground" />
        )}
      </motion.div>
    </div>
  );
}
