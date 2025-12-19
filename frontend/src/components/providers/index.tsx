'use client';

import React from 'react';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { TenantProvider } from '@/contexts/tenant-context';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Combined providers wrapper
 * Wraps the application with all necessary context providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
          />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default Providers;
