'use client';

import { AccountStatement } from '@/app/actions/statements';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface StatementViewProps {
  statement: AccountStatement;
  onExportPDF?: () => void;
  onPrint?: () => void;
}

export function StatementView({
  statement,
  onExportPDF,
  onPrint,
}: StatementViewProps) {
  const t = useTranslations();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Statement Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {statement.accountName}
                {statement.linkedEntityName && (
                  <span className="text-muted-foreground">
                    {' '}
                    - {statement.linkedEntityName}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Account {statement.accountCode} • {statement.accountType}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t('statements.print')}
                </Button>
              )}
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('statements.exportPDF')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('statements.period')}
              </p>
              <p className="font-medium">
                {formatDate(statement.startDate)} - {formatDate(statement.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('statements.openingBalance')}
              </p>
              <p className="font-medium">
                {formatCurrency(statement.openingBalance, statement.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('statements.closingBalance')}
              </p>
              <p className="font-medium">
                {formatCurrency(statement.closingBalance, statement.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('statements.transactions')}
              </p>
              <p className="font-medium">{statement.transactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('statements.transactions')}</CardTitle>
          <CardDescription>
            {t('statements.transactionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statement.transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('statements.noTransactions')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('statements.date')}</TableHead>
                    <TableHead>{t('statements.reference')}</TableHead>
                    <TableHead>{t('statements.description')}</TableHead>
                    <TableHead className="text-right">
                      {t('statements.debit')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('statements.credit')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('statements.balance')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.transactions.map((transaction, index) => (
                    <TableRow key={transaction.id + '-' + index}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.reference}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.debit > 0
                          ? formatCurrency(transaction.debit, statement.currency)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.credit > 0
                          ? formatCurrency(transaction.credit, statement.currency)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.balance, statement.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
