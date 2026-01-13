'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';

interface VersionConflictDialogProps {
  open: boolean;
  onReload: () => void;
}

/**
 * T090 [P] Version conflict UI dialog
 * Shows when optimistic locking detects concurrent edits
 */
export function VersionConflictDialog({ open, onReload }: VersionConflictDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" />
            {t('common.versionConflictTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.versionConflictMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onReload}>
            {t('common.reloadPage')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
