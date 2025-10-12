import { PostgrestError } from '@supabase/supabase-js';

/**
 * Centralized error handling for Supabase operations
 * Provides consistent error messages and logging
 */

// Error types
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Error response structure
export interface ErrorResponse {
  message: string;
  type: ErrorType;
  code?: string;
  details?: string;
}

/**
 * Process Supabase errors into standardized format
 */
export function handleSupabaseError(error: PostgrestError | Error | unknown): ErrorResponse {
  // Handle Supabase PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    
    // Authentication errors
    if (pgError.code === '401' || pgError.code === '403') {
      return {
        message: 'Authentication error. Please sign in again.',
        type: ErrorType.AUTHENTICATION,
        code: pgError.code,
        details: pgError.message
      };
    }
    
    // Database errors
    if (pgError.code.startsWith('22') || pgError.code.startsWith('23')) {
      return {
        message: 'Database error. Please try again later.',
        type: ErrorType.DATABASE,
        code: pgError.code,
        details: pgError.message
      };
    }
    
    // Return with original error code and message
    return {
      message: 'Operation failed. Please try again.',
      type: ErrorType.DATABASE,
      code: pgError.code,
      details: pgError.message
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('connection')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: ErrorType.NETWORK,
        details: error.message
      };
    }
    
    return {
      message: 'An error occurred. Please try again.',
      type: ErrorType.UNKNOWN,
      details: error.message
    };
  }
  
  // Handle unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: ErrorType.UNKNOWN,
    details: String(error)
  };
}

/**
 * Log errors to console with additional context
 */
export function logError(error: unknown, context: string): void {
  const formattedError = handleSupabaseError(error);
  console.error(`[${context}] ${formattedError.type.toUpperCase()} ERROR:`, {
    message: formattedError.message,
    code: formattedError.code,
    details: formattedError.details
  });
}

/**
 * Validate required fields in an object
 */
export function validateFields<T extends object>(data: T, requiredFields: (keyof T)[]): string | null {
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      return `Missing required field: ${String(field)}`;
    }
  }
  return null;
}