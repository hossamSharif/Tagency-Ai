import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('notFound')}
          </h2>
          <p className="text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
