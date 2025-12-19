import { Timestamp } from 'firebase/firestore';
import { UserRole } from '../auth';
import { Language, ThemePreference } from './tenant';

/**
 * User status
 */
export type UserStatus = 'active' | 'suspended' | 'pending_verification';

/**
 * User entity - represents a user within a tenant
 * Collection: `tenants/{tenantId}/users/{userId}`
 */
export interface User {
  /** Firebase Auth UID */
  id: string;
  /** User email */
  email: string;
  /** Display name */
  displayName: string;

  /** User role within the tenant */
  role: UserRole;

  /** Phone number */
  phone?: string;
  /** Avatar URL (Firebase Storage) */
  avatar?: string;

  /** Preferred language */
  language: Language;
  /** Theme preference */
  theme: ThemePreference;
  /** Email notification preference */
  emailNotifications: boolean;

  /** Partner office ID (if role is 'partner') */
  partnerOfficeId?: string;

  /** User status */
  status: UserStatus;
  /** Whether email is verified */
  emailVerified: boolean;
  /** Last login timestamp */
  lastLoginAt?: Timestamp;

  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * User creation input
 */
export type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;

/**
 * User update input
 */
export type UserUpdateInput = Partial<
  Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>
>;

/**
 * User profile update (what a user can update about themselves)
 */
export interface UserProfileUpdate {
  displayName?: string;
  phone?: string;
  avatar?: string;
  language?: Language;
  theme?: ThemePreference;
  emailNotifications?: boolean;
}

/**
 * User invitation input
 */
export interface UserInviteInput {
  email: string;
  displayName: string;
  role: UserRole;
  partnerOfficeId?: string;
}

/**
 * Default values for new users
 */
export const DEFAULT_USER_VALUES: Partial<User> = {
  language: 'ar',
  theme: 'system',
  emailNotifications: true,
  status: 'pending_verification',
  emailVerified: false,
};

/**
 * User status display info
 */
export const USER_STATUS_INFO: Record<
  UserStatus,
  { label: string; labelAr: string; color: string }
> = {
  active: { label: 'Active', labelAr: 'نشط', color: 'green' },
  suspended: { label: 'Suspended', labelAr: 'موقوف', color: 'red' },
  pending_verification: { label: 'Pending Verification', labelAr: 'في انتظار التحقق', color: 'yellow' },
};

/**
 * User role display info
 */
export const USER_ROLE_INFO: Record<UserRole, { label: string; labelAr: string; description: string }> = {
  owner: {
    label: 'Owner',
    labelAr: 'مالك',
    description: 'Full access to all features and settings',
  },
  admin: {
    label: 'Admin',
    labelAr: 'مدير',
    description: 'Can manage users, packages, and settings',
  },
  staff: {
    label: 'Staff',
    labelAr: 'موظف',
    description: 'Can manage packages, customers, and bookings',
  },
  customer: {
    label: 'Customer',
    labelAr: 'عميل',
    description: 'Can view and book packages',
  },
  partner: {
    label: 'Partner',
    labelAr: 'شريك',
    description: 'Can view assigned services and commissions',
  },
};

/**
 * Check if a user can manage other users
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if a user can invite users with a specific role
 */
export function canInviteRole(inviterRole: UserRole, targetRole: UserRole): boolean {
  if (inviterRole === 'owner') return true;
  if (inviterRole === 'admin') {
    return targetRole !== 'owner' && targetRole !== 'admin';
  }
  return false;
}
