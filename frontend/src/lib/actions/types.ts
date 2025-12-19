/**
 * Server Action Types and Helpers
 *
 * Provides standardized types and utilities for Next.js Server Actions
 */

/**
 * Standard action result type
 * All server actions should return this type
 */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };

/**
 * Create a success result
 */
export function success<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Create an error result
 */
export function error(
  errorMessage: string,
  code?: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, error: errorMessage, code, fieldErrors };
}

/**
 * Action state for forms (used with useActionState)
 */
export interface ActionState<T = void> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Initial action state
 */
export const initialActionState: ActionState = {
  status: 'idle',
};

/**
 * Convert ActionResult to ActionState
 */
export function toActionState<T>(result: ActionResult<T>): ActionState<T> {
  if (result.success) {
    return {
      status: 'success',
      data: result.data,
      message: result.message,
    };
  }
  return {
    status: 'error',
    error: result.error,
    fieldErrors: result.fieldErrors,
  };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business logic errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  LIMIT_REACHED: 'LIMIT_REACHED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Create a typed error
 */
export function createError(code: ErrorCode, message: string): ActionResult<never> {
  return error(message, code);
}

/**
 * Check if result is a success
 */
export function isSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Check if result is an error
 */
export function isError<T>(result: ActionResult<T>): result is { success: false; error: string } {
  return result.success === false;
}

/**
 * Unwrap result or throw
 */
export function unwrapResult<T>(result: ActionResult<T>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(result.error);
}

/**
 * Wrap an async function in error handling
 */
export async function safeAction<T>(
  fn: () => Promise<T>,
  errorMessage = 'An unexpected error occurred'
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (err) {
    console.error('Action error:', err);

    if (err instanceof Error) {
      return error(err.message, ErrorCodes.INTERNAL_ERROR);
    }

    return error(errorMessage, ErrorCodes.INTERNAL_ERROR);
  }
}

/**
 * Type for form action handlers
 */
export type FormAction<TInput, TOutput = void> = (
  prevState: ActionState<TOutput>,
  formData: FormData
) => Promise<ActionState<TOutput>>;

/**
 * Parse form data to typed object
 */
export function parseFormData<T extends Record<string, unknown>>(
  formData: FormData,
  keys: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};

  for (const key of keys) {
    const value = formData.get(key as string);
    if (value !== null) {
      result[key] = value as T[keyof T];
    }
  }

  return result;
}
