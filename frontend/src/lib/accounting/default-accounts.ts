/**
 * Default Accounts Initialization
 * Creates system accounts for the chart of accounts when a workspace is first set up
 */

import { Account, AccountType, AccountSubtype } from '@/types/models/account';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface DefaultAccountConfig {
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  subtype: AccountSubtype;
  description?: string;
}

/**
 * Default system accounts that should be created for every workspace
 * Based on data-model.md default accounts table
 */
const DEFAULT_ACCOUNTS: DefaultAccountConfig[] = [
  // Assets
  {
    code: '1001',
    name: 'Cash',
    nameAr: 'النقد',
    type: 'asset',
    subtype: 'cash',
    description: 'Cash on hand'
  },
  {
    code: '1002',
    name: 'Bank',
    nameAr: 'البنك',
    type: 'asset',
    subtype: 'bank',
    description: 'Bank account'
  },
  // Income
  {
    code: '4001',
    name: 'Service Revenue',
    nameAr: 'إيرادات الخدمات',
    type: 'income',
    subtype: 'revenue',
    description: 'Revenue from services provided'
  },
  // Expenses
  {
    code: '5001',
    name: 'General Expenses',
    nameAr: 'المصروفات العامة',
    type: 'expense',
    subtype: 'expense_general',
    description: 'General business expenses'
  },
  {
    code: '5002',
    name: 'Rent',
    nameAr: 'الإيجار',
    type: 'expense',
    subtype: 'expense_rent',
    description: 'Office rent'
  },
  {
    code: '5003',
    name: 'Utilities',
    nameAr: 'المرافق',
    type: 'expense',
    subtype: 'expense_utilities',
    description: 'Electricity, water, internet, etc.'
  },
  {
    code: '5004',
    name: 'Supplies',
    nameAr: 'اللوازم',
    type: 'expense',
    subtype: 'expense_supplies',
    description: 'Office supplies and materials'
  }
];

/**
 * Initializes default accounts for a new workspace
 * This should be called once during workspace creation/signup
 *
 * @param tenantId - The workspace/tenant ID
 * @returns Promise with created account IDs
 */
export async function initializeDefaultAccounts(tenantId: string): Promise<string[]> {
  const accountsRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts');

  // Check if accounts already exist
  const existingAccounts = await accountsRef.limit(1).get();
  if (!existingAccounts.empty) {
    console.log(`Default accounts already exist for tenant ${tenantId}`);
    return [];
  }

  const batch = adminDb.batch();
  const createdIds: string[] = [];
  const now = Timestamp.now();

  for (const config of DEFAULT_ACCOUNTS) {
    const accountRef = accountsRef.doc();
    const account: Account = {
      id: accountRef.id,
      code: config.code,
      name: config.name,
      nameAr: config.nameAr,
      description: config.description,
      type: config.type,
      subtype: config.subtype,
      balance: 0,
      lastUpdated: now,
      isSystem: true, // System accounts cannot be deleted
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    batch.set(accountRef, account);
    createdIds.push(accountRef.id);
  }

  await batch.commit();
  console.log(`Created ${createdIds.length} default accounts for tenant ${tenantId}`);

  return createdIds;
}

/**
 * Creates a receivable account for a customer
 * Called automatically when a customer is created
 *
 * @param tenantId - The workspace/tenant ID
 * @param customerId - The customer ID
 * @param customerName - The customer name
 * @returns Promise with created account ID
 */
export async function createCustomerAccount(
  tenantId: string,
  customerId: string,
  customerName: string
): Promise<string> {
  const accountsRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts');

  // Check if account already exists
  const existingAccount = await accountsRef
    .where('linkedEntityType', '==', 'customer')
    .where('linkedEntityId', '==', customerId)
    .limit(1)
    .get();

  if (!existingAccount.empty) {
    console.log(`Account already exists for customer ${customerId}`);
    return existingAccount.docs[0].id;
  }

  // Generate account code (2xxx series for customer receivables)
  const lastCustomerAccount = await accountsRef
    .where('type', '==', 'asset')
    .where('subtype', '==', 'receivable')
    .orderBy('code', 'desc')
    .limit(1)
    .get();

  let nextCode = 2001;
  if (!lastCustomerAccount.empty) {
    const lastCode = parseInt(lastCustomerAccount.docs[0].data().code);
    if (!isNaN(lastCode) && lastCode >= 2000) {
      nextCode = lastCode + 1;
    }
  }

  const accountRef = accountsRef.doc();
  const now = Timestamp.now();

  const account: Account = {
    id: accountRef.id,
    code: nextCode.toString(),
    name: `Accounts Receivable - ${customerName}`,
    nameAr: `حسابات القبض - ${customerName}`,
    description: `Customer account for ${customerName}`,
    type: 'asset',
    subtype: 'receivable',
    linkedEntityType: 'customer',
    linkedEntityId: customerId,
    balance: 0,
    lastUpdated: now,
    isSystem: false,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  await accountRef.set(account);
  console.log(`Created account ${account.code} for customer ${customerId}`);

  return accountRef.id;
}

/**
 * Creates a payable account for a partner
 * Called automatically when a partner is created
 *
 * @param tenantId - The workspace/tenant ID
 * @param partnerId - The partner ID
 * @param partnerName - The partner name
 * @returns Promise with created account ID
 */
export async function createPartnerAccount(
  tenantId: string,
  partnerId: string,
  partnerName: string
): Promise<string> {
  const accountsRef = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('accounts');

  // Check if account already exists
  const existingAccount = await accountsRef
    .where('linkedEntityType', '==', 'partner')
    .where('linkedEntityId', '==', partnerId)
    .limit(1)
    .get();

  if (!existingAccount.empty) {
    console.log(`Account already exists for partner ${partnerId}`);
    return existingAccount.docs[0].id;
  }

  // Generate account code (3xxx series for partner payables)
  const lastPartnerAccount = await accountsRef
    .where('type', '==', 'liability')
    .where('subtype', '==', 'payable')
    .orderBy('code', 'desc')
    .limit(1)
    .get();

  let nextCode = 3001;
  if (!lastPartnerAccount.empty) {
    const lastCode = parseInt(lastPartnerAccount.docs[0].data().code);
    if (!isNaN(lastCode) && lastCode >= 3000) {
      nextCode = lastCode + 1;
    }
  }

  const accountRef = accountsRef.doc();
  const now = Timestamp.now();

  const account: Account = {
    id: accountRef.id,
    code: nextCode.toString(),
    name: `Accounts Payable - ${partnerName}`,
    nameAr: `حسابات الدفع - ${partnerName}`,
    description: `Partner account for ${partnerName}`,
    type: 'liability',
    subtype: 'payable',
    linkedEntityType: 'partner',
    linkedEntityId: partnerId,
    balance: 0,
    lastUpdated: now,
    isSystem: false,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  await accountRef.set(account);
  console.log(`Created account ${account.code} for partner ${partnerId}`);

  return accountRef.id;
}
