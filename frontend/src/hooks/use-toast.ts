'use client';

/**
 * Toast Hook
 *
 * Wrapper around sonner's toast function for consistent toast notifications.
 */

import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastProps) => {
    const message = title || description || '';
    const options = {
      description: title ? description : undefined,
      duration: duration || 5000,
    };

    if (variant === 'destructive') {
      sonnerToast.error(message, options);
    } else {
      sonnerToast.success(message, options);
    }
  };

  return { toast };
}

/**
 * Direct toast functions for simpler usage
 */
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};
