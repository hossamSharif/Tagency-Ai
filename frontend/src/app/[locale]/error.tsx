'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t('general')}
          </h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-muted p-4 rounded-lg text-start">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('tryAgain')}
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          If this issue persists, please contact support.
        </p>
      </div>
    </div>
  );
}
