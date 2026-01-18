'use client';

/**
 * HeroShowcaseSlider Component
 *
 * Main slider component for the hero section feature showcase.
 * Features:
 * - Auto-rotation every 10 seconds (continuous loop)
 * - Manual navigation via swipe/drag
 * - Pause on hover
 * - RTL/LTR support
 * - Smooth transitions with Framer Motion
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { GlowingBorder } from './glowing-border';
import { ShowcaseSlide } from './showcase-slide';
import { PassportScanShowcase } from './showcases/passport-scan-showcase';
import { InvoiceCreationShowcase } from './showcases/invoice-creation-showcase';
import { JournalEntriesShowcase } from './showcases/journal-entries-showcase';
import { DashboardShowcase } from './showcases/dashboard-showcase';

// Slide configuration
const slides = [
  {
    id: 'dashboard',
    component: DashboardShowcase,
    titleKey: 'dashboard.title',
  },
  {
    id: 'passport-scan',
    component: PassportScanShowcase,
    titleKey: 'passportScan.title',
  },
  {
    id: 'invoice-creation',
    component: InvoiceCreationShowcase,
    titleKey: 'invoiceCreation.title',
  },
  {
    id: 'journal-entries',
    component: JournalEntriesShowcase,
    titleKey: 'journalEntries.title',
  },
];

const SWIPE_THRESHOLD = 50; // pixels
const AUTO_ROTATION_INTERVAL = 12000; // 12 seconds - allows animation to fully complete

export function HeroShowcaseSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const t = useTranslations('landing.hero.showcase');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Auto-rotation effect
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        paginate(1);
      }, AUTO_ROTATION_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [isPaused, activeSlide]);

  // Paginate to next/previous slide
  const paginate = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setActiveSlide((prev) => {
        const nextSlide = prev + newDirection;
        if (nextSlide < 0) return slides.length - 1;
        if (nextSlide >= slides.length) return 0;
        return nextSlide;
      });
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeDirection = isRTL ? -1 : 1;

      if (info.offset.x > SWIPE_THRESHOLD) {
        // Swipe right (or left in RTL) - go to previous
        paginate(swipeDirection * -1);
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        // Swipe left (or right in RTL) - go to next
        paginate(swipeDirection);
      }
    },
    [isRTL, paginate]
  );

  const currentSlide = slides[activeSlide];
  const SlideComponent = currentSlide.component;

  return (
    <motion.div
      onHoverStart={() => setIsPaused(true)}
      onHoverEnd={() => setIsPaused(false)}
      className="relative w-full"
    >
      <GlowingBorder>
        <div className="relative overflow-hidden min-h-[340px] md:min-h-[380px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeSlide}
              custom={direction}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction < 0 ? 100 : -100 }}
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <ShowcaseSlide
                direction={direction}
                title={t(currentSlide.titleKey)}
              >
                <SlideComponent />
              </ShowcaseSlide>
            </motion.div>
          </AnimatePresence>

          {/* Touch hint for mobile (subtle, fades after 3s) */}
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 3, duration: 1 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none md:hidden"
          >
            {isRTL ? '← اسحب للتصفح ←' : '→ Swipe to explore →'}
          </motion.div>
        </div>
      </GlowingBorder>

      {/* Slide indicators (dots) - Hidden as per requirements */}
      {/* Could add here if user requests it later */}
    </motion.div>
  );
}
