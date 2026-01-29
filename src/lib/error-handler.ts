/**
 * Error Handler Utility
 * 
 * Maps database and API errors to safe, user-friendly messages
 * to prevent information leakage about internal system details.
 */

/**
 * Maps database errors to user-friendly messages.
 * Prevents exposure of schema details, constraint names, and internal implementation.
 */
export function mapDatabaseError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string; error_code?: string };
  const code = err.code || err.error_code;
  const message = err.message?.toLowerCase() || '';

  // PostgreSQL error codes
  switch (code) {
    case '23505': // unique_violation
      return 'This record already exists.';
    case '23503': // foreign_key_violation
      return 'Referenced record not found.';
    case '23502': // not_null_violation
      return 'Required field is missing.';
    case '23514': // check_violation
      return 'The provided data does not meet requirements.';
    case '42501': // insufficient_privilege
      return 'You do not have permission to perform this action.';
    case '42P01': // undefined_table
      return 'An error occurred. Please contact support.';
    case '42703': // undefined_column
      return 'An error occurred. Please contact support.';
    case '22P02': // invalid_text_representation
      return 'Invalid data format provided.';
    case '22003': // numeric_value_out_of_range
      return 'The provided number is out of range.';
    case 'PGRST116': // PostgREST: Row not found
      return 'Record not found.';
    case 'PGRST301': // PostgREST: JWT expired
      return 'Your session has expired. Please sign in again.';
  }

  // Check for RLS errors
  if (message.includes('row level security') || message.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }

  // Check for auth errors
  if (message.includes('jwt') || message.includes('token')) {
    return 'Authentication error. Please sign in again.';
  }

  // Check for timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Check for connection errors
  if (message.includes('connection') || message.includes('network')) {
    return 'Connection error. Please check your internet and try again.';
  }

  // Generic fallback - never expose the actual error message
  return 'An error occurred. Please try again or contact support.';
}

/**
 * Logs error details for debugging while returning a safe message.
 * Use this in production to maintain full error visibility for developers
 * while protecting users from internal details.
 */
export function handleError(error: unknown, context?: string): string {
  // Log full error for debugging (server-side / dev console)
  console.error(`[${context || 'Error'}]`, error);
  
  // Return safe message for user
  return mapDatabaseError(error);
}
