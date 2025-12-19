/**
 * Authentication Validation Schemas
 *
 * Zod schemas for signup, login, password reset, and user management
 */

import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  requiredString,
  phoneSchema,
  currencyCodeSchema,
  languageSchema,
  themeSchema,
  userRoleSchema,
} from './index';

// ==========================================
// Signup Schemas
// ==========================================

/**
 * Signup form validation
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  officeName: z
    .string()
    .min(2, 'Office name must be at least 2 characters')
    .max(200, 'Office name cannot exceed 200 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  currency: currencyCodeSchema,
  language: languageSchema.default('ar'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Server-side signup schema (without confirmPassword)
 */
export const signupServerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  officeName: z
    .string()
    .min(2, 'Office name must be at least 2 characters')
    .max(200, 'Office name cannot exceed 200 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  currency: currencyCodeSchema,
  language: languageSchema.default('ar'),
});

export type SignupServerInput = z.infer<typeof signupServerSchema>;

// ==========================================
// Login Schemas
// ==========================================

/**
 * Login form validation
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ==========================================
// Password Schemas
// ==========================================

/**
 * Reset password request
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Update password (requires current password)
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * Set new password (from reset email link)
 */
export const setNewPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;

// ==========================================
// Profile Schemas
// ==========================================

/**
 * Update user profile
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  phone: phoneSchema,
  language: languageSchema.optional(),
  theme: themeSchema.optional(),
  emailNotifications: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ==========================================
// User Invitation Schemas
// ==========================================

/**
 * Invite user to team
 */
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'staff'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  invitationToken: requiredString,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// ==========================================
// User Management Schemas
// ==========================================

/**
 * Update user role (admin only)
 */
export const updateUserRoleSchema = z.object({
  userId: requiredString,
  role: z.enum(['admin', 'staff'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Suspend/activate user
 */
export const updateUserStatusSchema = z.object({
  userId: requiredString,
  status: z.enum(['active', 'suspended']),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

// ==========================================
// Email Verification
// ==========================================

/**
 * Resend verification email
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
