import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

/**
 * Partner office status
 */
export type PartnerOfficeStatus = 'active' | 'suspended' | 'pending';

/**
 * Partner Office entity - represents an outsourcing partner
 * Collection: `tenants/{tenantId}/partnerOffices/{partnerId}`
 */
export interface PartnerOffice {
  /** Firestore document ID */
  id: string;
  /** Partner office name */
  name: string;
  /** Short code for display */
  code: string;

  /** Contact person name */
  contactPerson: string;
  /** Contact email */
  email: string;
  /** Contact phone */
  phone?: string;

  /** Default commission percentage for this partner */
  defaultCommissionPercentage: number;

  /** Partner status */
  status: PartnerOfficeStatus;

  /** Bank account details for settlements */
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
    swiftCode?: string;
    accountHolder: string;
  };

  /** Notes about this partner */
  notes?: string;

  /** Total commission earned */
  totalCommissionsEarned: number;
  /** Total commission paid (settled) */
  totalCommissionsPaid: number;
  /** Pending commission balance */
  pendingCommissions: number;

  /** Currency for settlements */
  currency: CurrencyCode;

  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * Partner office creation input
 */
export type PartnerOfficeCreateInput = Omit<
  PartnerOffice,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'totalCommissionsEarned'
  | 'totalCommissionsPaid'
  | 'pendingCommissions'
>;

/**
 * Partner office update input
 */
export type PartnerOfficeUpdateInput = Partial<
  Omit<
    PartnerOffice,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'totalCommissionsEarned'
    | 'totalCommissionsPaid'
    | 'pendingCommissions'
  >
>;

/**
 * Commission Settlement entity
 * Collection: `tenants/{tenantId}/settlements/{settlementId}`
 */
export interface CommissionSettlement {
  id: string;
  /** Partner office ID */
  partnerOfficeId: string;
  /** Partner office name (denormalized) */
  partnerOfficeName: string;

  /** List of invoice IDs included in this settlement */
  invoiceIds: string[];
  /** List of booking IDs included in this settlement */
  bookingIds: string[];

  /** Total commission amount */
  amount: number;
  /** Currency */
  currency: CurrencyCode;

  /** Settlement period */
  periodStart: Timestamp;
  periodEnd: Timestamp;

  /** Settlement status */
  status: 'pending' | 'approved' | 'paid' | 'disputed';

  /** Payment details */
  paymentMethod?: 'bank_transfer' | 'cash' | 'check';
  paymentReference?: string;
  paidAt?: Timestamp;

  /** Dispute details */
  disputeReason?: string;
  disputedAt?: Timestamp;

  /** Approved by user */
  approvedBy?: string;
  approvedAt?: Timestamp;

  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * Partner office status display info
 */
export const PARTNER_STATUS_INFO: Record<
  PartnerOfficeStatus,
  { label: string; labelAr: string; color: string }
> = {
  active: { label: 'Active', labelAr: 'نشط', color: 'green' },
  suspended: { label: 'Suspended', labelAr: 'موقوف', color: 'red' },
  pending: { label: 'Pending', labelAr: 'قيد الانتظار', color: 'yellow' },
};

/**
 * Settlement status display info
 */
export const SETTLEMENT_STATUS_INFO: Record<
  CommissionSettlement['status'],
  { label: string; labelAr: string; color: string }
> = {
  pending: { label: 'Pending', labelAr: 'قيد الانتظار', color: 'yellow' },
  approved: { label: 'Approved', labelAr: 'معتمدة', color: 'blue' },
  paid: { label: 'Paid', labelAr: 'مدفوعة', color: 'green' },
  disputed: { label: 'Disputed', labelAr: 'معترض عليها', color: 'red' },
};

/**
 * Calculate pending commissions
 */
export function calculatePendingCommissions(partner: PartnerOffice): number {
  return partner.totalCommissionsEarned - partner.totalCommissionsPaid;
}
