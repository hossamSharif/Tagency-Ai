'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/require-role';
import { Timestamp } from 'firebase-admin/firestore';

export interface StatementTransaction {
  id: string;
  date: Date;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'invoice' | 'payment' | 'expense' | 'adjustment';
}

export interface AccountStatement {
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: string;
  linkedEntityType?: 'customer' | 'partner';
  linkedEntityId?: string;
  linkedEntityName?: string;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
  currency: string;
}

/**
 * Get statement for a specific account with date range filter
 */
export async function getAccountStatement(params: {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ success: boolean; data?: AccountStatement; error?: string }> {
  const user = await getSessionUser();
  if (!user?.tenantId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { accountId, startDate, endDate } = params;

    // Default date range: current month
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date();

    // Get account details
    const accountDoc = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('accounts')
      .doc(accountId)
      .get();

    if (!accountDoc.exists) {
      return { success: false, error: 'Account not found' };
    }

    const account = accountDoc.data();

    // Get linked entity name if applicable
    let linkedEntityName: string | undefined;
    if (account?.linkedEntityType && account?.linkedEntityId) {
      if (account.linkedEntityType === 'customer') {
        const customerDoc = await adminDb
          .collection('tenants')
          .doc(user.tenantId)
          .collection('customers')
          .doc(account.linkedEntityId)
          .get();
        linkedEntityName = customerDoc.data()?.name;
      } else if (account.linkedEntityType === 'partner') {
        const partnerDoc = await adminDb
          .collection('tenants')
          .doc(user.tenantId)
          .collection('partners')
          .doc(account.linkedEntityId)
          .get();
        linkedEntityName = partnerDoc.data()?.name;
      }
    }

    // Get journal entries that affect this account
    const journalEntriesSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('journalEntries')
      .where('date', '>=', Timestamp.fromDate(start))
      .where('date', '<=', Timestamp.fromDate(end))
      .orderBy('date', 'asc')
      .orderBy('createdAt', 'asc')
      .get();

    // Filter entries that include this account and calculate running balance
    const transactions: StatementTransaction[] = [];
    let runningBalance = account?.balance || 0;

    // Calculate opening balance (balance before start date)
    const openingEntriesSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('journalEntries')
      .where('date', '<', Timestamp.fromDate(start))
      .get();

    let openingBalance = 0;
    openingEntriesSnapshot.forEach((doc) => {
      const entry = doc.data();
      const relevantLines = entry.lines?.filter(
        (line: any) => line.accountId === accountId
      );
      relevantLines?.forEach((line: any) => {
        openingBalance += (line.debit || 0) - (line.credit || 0);
      });
    });

    runningBalance = openingBalance;

    // Process transactions in date range
    journalEntriesSnapshot.forEach((doc) => {
      const entry = doc.data();
      const relevantLines = entry.lines?.filter(
        (line: any) => line.accountId === accountId
      );

      relevantLines?.forEach((line: any) => {
        const debit = line.debit || 0;
        const credit = line.credit || 0;
        runningBalance += debit - credit;

        transactions.push({
          id: doc.id,
          date: entry.date?.toDate() || new Date(),
          description: entry.description || '',
          reference: entry.entryNumber || '',
          debit,
          credit,
          balance: runningBalance,
          type: entry.type || 'adjustment',
        });
      });
    });

    // Get tenant currency
    const tenantDoc = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .get();
    const currency = tenantDoc.data()?.currency || 'SAR';

    const statement: AccountStatement = {
      accountId: accountDoc.id,
      accountName: account?.name || '',
      accountCode: account?.code || '',
      accountType: account?.type || '',
      linkedEntityType: account?.linkedEntityType,
      linkedEntityId: account?.linkedEntityId,
      linkedEntityName,
      startDate: start,
      endDate: end,
      openingBalance,
      closingBalance: runningBalance,
      transactions,
      currency,
    };

    return { success: true, data: statement };
  } catch (error) {
    console.error('Error generating account statement:', error);
    return { success: false, error: 'Failed to generate statement' };
  }
}

/**
 * Get list of accounts that can have statements
 */
export async function getStatementAccounts(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    linkedEntityType?: 'customer' | 'partner';
    linkedEntityName?: string;
  }>;
  error?: string;
}> {
  const user = await getSessionUser();
  if (!user?.tenantId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get all accounts that are receivable or payable (customer/partner accounts)
    const accountsSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('accounts')
      .where('isActive', '==', true)
      .where('subtype', 'in', ['receivable', 'payable'])
      .orderBy('code', 'asc')
      .get();

    const accountsWithNames = await Promise.all(
      accountsSnapshot.docs.map(async (doc) => {
        const account = doc.data();
        let linkedEntityName: string | undefined;

        // Get linked entity name
        if (account.linkedEntityType && account.linkedEntityId) {
          if (account.linkedEntityType === 'customer') {
            const customerDoc = await adminDb
              .collection('tenants')
              .doc(user.tenantId)
              .collection('customers')
              .doc(account.linkedEntityId)
              .get();
            linkedEntityName = customerDoc.data()?.name;
          } else if (account.linkedEntityType === 'partner') {
            const partnerDoc = await adminDb
              .collection('tenants')
              .doc(user.tenantId)
              .collection('partners')
              .doc(account.linkedEntityId)
              .get();
            linkedEntityName = partnerDoc.data()?.name;
          }
        }

        return {
          id: doc.id,
          name: account.name || '',
          code: account.code || '',
          type: account.type || '',
          linkedEntityType: account.linkedEntityType,
          linkedEntityName,
        };
      })
    );

    return { success: true, data: accountsWithNames };
  } catch (error) {
    console.error('Error fetching statement accounts:', error);
    return { success: false, error: 'Failed to fetch accounts' };
  }
}

/**
 * Get customer statement (convenience method)
 */
export async function getCustomerStatement(params: {
  customerId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ success: boolean; data?: AccountStatement; error?: string }> {
  const user = await getSessionUser();
  if (!user?.tenantId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Find customer's account
    const accountsSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('accounts')
      .where('linkedEntityType', '==', 'customer')
      .where('linkedEntityId', '==', params.customerId)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      return { success: false, error: 'Customer account not found' };
    }

    const accountId = accountsSnapshot.docs[0].id;
    return getAccountStatement({
      accountId,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  } catch (error) {
    console.error('Error getting customer statement:', error);
    return { success: false, error: 'Failed to get customer statement' };
  }
}

/**
 * Get partner statement (convenience method)
 */
export async function getPartnerStatement(params: {
  partnerId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ success: boolean; data?: AccountStatement; error?: string }> {
  const user = await getSessionUser();
  if (!user?.tenantId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Find partner's account
    const accountsSnapshot = await adminDb
      .collection('tenants')
      .doc(user.tenantId)
      .collection('accounts')
      .where('linkedEntityType', '==', 'partner')
      .where('linkedEntityId', '==', params.partnerId)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      return { success: false, error: 'Partner account not found' };
    }

    const accountId = accountsSnapshot.docs[0].id;
    return getAccountStatement({
      accountId,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  } catch (error) {
    console.error('Error getting partner statement:', error);
    return { success: false, error: 'Failed to get partner statement' };
  }
}
