// Account type definition per data-model.md
// T002 [P] Create Account type (Chart of Accounts)

import { Timestamp } from 'firebase/firestore';

export type AccountType = 'asset' | 'liability' | 'income' | 'expense';

export type AccountSubtype =
  | 'cash'
  | 'bank'
  | 'receivable'
  | 'payable'
  | 'revenue'
  | 'expense_general'
  | 'expense_rent'
  | 'expense_utilities'
  | 'expense_supplies'
  | 'expense_other';

/**
 * Account - Financial accounts for double-entry accounting
 * Collection: `tenants/{tenantId}/accounts/{accountId}`
 */
export interface Account {
  // Identity
  id: string;
  code: string;

  // Basic Info
  name: string;
  nameAr: string;
  description?: string;

  // Classification
  type: AccountType;
  subtype: AccountSubtype;

  // Linked Entity (for auto-created accounts)
  linkedEntityType?: 'customer' | 'partner';
  linkedEntityId?: string;

  // Balance (denormalized for quick access)
  balance: number;
  lastUpdated: Timestamp;

  // Status
  isSystem: boolean;
  isActive: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input for creating a new account
 */
export type CreateAccountInput = Omit<
  Account,
  'id' | 'balance' | 'lastUpdated' | 'createdAt' | 'updatedAt'
>;

/**
 * Input for updating an account
 */
export type UpdateAccountInput = Partial<
  Omit<Account, 'id' | 'code' | 'balance' | 'lastUpdated' | 'isSystem' | 'createdAt' | 'updatedAt'>
>;

/**
 * Default system accounts
 */
export interface SystemAccountDefinition {
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  subtype: AccountSubtype;
}

export const DEFAULT_SYSTEM_ACCOUNTS: SystemAccountDefinition[] = [
  { code: '1001', name: 'Cash', nameAr: 'نقدي', type: 'asset', subtype: 'cash' },
  { code: '1002', name: 'Bank', nameAr: 'بنك', type: 'asset', subtype: 'bank' },
  { code: '4001', name: 'Service Revenue', nameAr: 'إيرادات الخدمات', type: 'income', subtype: 'revenue' },
  { code: '5001', name: 'General Expenses', nameAr: 'مصاريف عامة', type: 'expense', subtype: 'expense_general' },
  { code: '5002', name: 'Rent', nameAr: 'إيجار', type: 'expense', subtype: 'expense_rent' },
  { code: '5003', name: 'Utilities', nameAr: 'مرافق', type: 'expense', subtype: 'expense_utilities' },
  { code: '5004', name: 'Supplies', nameAr: 'لوازم', type: 'expense', subtype: 'expense_supplies' },
];
