'use client';

/**
 * WhatsAppFloatButton Component
 *
 * Floating WhatsApp button with animated entrance for quick contact.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '+966543620486';

export function WhatsAppFloatButton() {
  const t = useTranslations('landing.preorder');
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    // Delay entrance for dramatic effect
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    // Show tooltip after button appears
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    // Hide tooltip after a few seconds
    const hideTooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    // Stop pulsing after initial attention grab
    const pulseTimer = setTimeout(() => {
      setIsPulsing(false);
    }, 10000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(tooltipTimer);
      clearTimeout(hideTooltipTimer);
      clearTimeout(pulseTimer);
    };
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent(t('whatsappMessage'));
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`,
      '_blank'
    );
  };

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 end-6 z-50 flex items-center gap-3',
        'transition-all duration-700 ease-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-20 opacity-0'
      )}
    >
      {/* Tooltip */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 max-w-[220px]',
          'transition-all duration-500 ease-out',
          showTooltip
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-4 opacity-0 scale-95 pointer-events-none'
        )}
      >
        <button
          onClick={handleDismissTooltip}
          className="absolute -top-2 -end-2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {t('whatsappDesc')}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
          {t('instantResponse')}
        </p>
        {/* Arrow pointing to button */}
        <div className="absolute top-1/2 -end-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-s-8 border-transparent border-s-white dark:border-s-gray-800" />
      </div>

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        className={cn(
          'group relative flex items-center justify-center',
          'w-16 h-16 rounded-full',
          'bg-gradient-to-br from-green-500 to-green-600',
          'shadow-lg shadow-green-500/30',
          'hover:shadow-xl hover:shadow-green-500/40',
          'hover:scale-110',
          'active:scale-95',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-4 focus:ring-green-500/30'
        )}
        aria-label="Contact us on WhatsApp"
      >
        {/* Ping animation rings */}
        {isPulsing && (
          <>
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
            <span
              className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-10"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}

        {/* Rotating border effect on hover */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-400 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-opacity duration-300" style={{ animationDuration: '3s' }} />

        {/* Inner circle */}
        <span className="absolute inset-1 rounded-full bg-gradient-to-br from-green-500 to-green-600" />

        {/* Icon */}
        <MessageCircle className="relative h-8 w-8 text-white fill-white/20 group-hover:scale-110 transition-transform duration-300" />

        {/* Notification dot */}
        <span className="absolute top-0 end-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white" />
        </span>
      </button>
    </div>
  );
}
