/**
 * Comprehensive Error Handling Utilities
 * 
 * Provides standardized error handling patterns for the Ken-AI application.
 */

import { toast } from 'sonner'
import { AppError, ValidationError, AuthError, ForbiddenError, NotFoundError } from '@/types/utils'
import * as Sentry from '@sentry/nextjs'

// ============================================================================
// ERROR HANDLER CONFIGURATION
// ============================================================================

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  reportToSentry?: boolean
  customMessage?: string
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  reportToSentry: true,
}

// ============================================================================
// MAIN ERROR HANDLER
// ============================================================================

/**
 * Centralized error handler with configurable behavior
 * 
 * @param error - The error to handle
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * try {
 *   await fetchData()
 * } catch (error) {
 *   handleError(error, { showToast: true })
 * }
 * ```
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = DEFAULT_OPTIONS
): void {
  const { showToast, logToConsole, reportToSentry, customMessage } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  // Convert to AppError if needed
  const appError = normalizeError(error)

  // Log to console
  if (logToConsole) {
    logError(appError)
  }

  // Report to Sentry
  if (reportToSentry && shouldReportToSentry(appError)) {
    reportError(appError)
  }

  // Show toast notification
  if (showToast) {
    showErrorToast(appError, customMessage)
  }
}

// ============================================================================
// ERROR NORMALIZATION
// ============================================================================

/**
 * Normalize any error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new AppError('Network error. Please check your connection.', 'NETWORK_ERROR', 0)
    }

    // Check if it's a timeout
    if (error.message.includes('timeout')) {
      return new AppError('Request timed out. Please try again.', 'TIMEOUT_ERROR', 408)
    }

    return new AppError(error.message, 'UNKNOWN_ERROR', 500)
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(error, 'STRING_ERROR', 500)
  }

  // Handle unknown errors
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error with context
 */
function logError(error: AppError): void {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    context: error.context,
    timestamp: new Date().toISOString(),
  }

  // Use appropriate console method based on severity
  if (error.statusCode >= 500) {
    console.error('🔴 Server Error:', logData)
  } else if (error.statusCode >= 400) {
    console.warn('🟡 Client Error:', logData)
  } else {
    console.log('🔵 Info:', logData)
  }
}

// ============================================================================
// SENTRY REPORTING
// ============================================================================

/**
 * Determine if error should be reported to Sentry
 */
function shouldReportToSentry(error: AppError): boolean {
  // Don't report client-side validation errors
  if (error instanceof ValidationError) {
    return false
  }

  // Don't report expected 404s
  if (error instanceof NotFoundError && error.context?.expected) {
    return false
  }

  // Always report server errors
  if (error.statusCode >= 500) {
    return true
  }

  // Report auth errors
  if (error instanceof AuthError || error instanceof ForbiddenError) {
    return true
  }

  return false
}

/**
 * Report error to Sentry with context
 */
function reportError(error: AppError): void {
  Sentry.withScope((scope) => {
    // Set error context
    scope.setTag('error_code', error.code)
    scope.setTag('status_code', error.statusCode.toString())
    scope.setLevel(getSentryLevel(error.statusCode))

    // Add extra context
    if (error.context) {
      scope.setContext('error_details', error.context)
    }

    // Capture error
    Sentry.captureException(error)
  })
}

/**
 * Map HTTP status code to Sentry level
 */
function getSentryLevel(statusCode: number): Sentry.SeverityLevel {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warning'
  return 'info'
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/**
 * Show error toast notification
 */
function showErrorToast(error: AppError, customMessage?: string): void {
  const title = customMessage || getErrorMessage(error)
  const description = getErrorDescription(error)

  toast.error(title, {
    description,
    duration: getToastDuration(error),
    action: getToastAction(error),
  })
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'AUTH_ERROR':
      return 'Authentication failed'
    case 'FORBIDDEN':
      return 'Access denied'
    case 'NOT_FOUND':
      return 'Resource not found'
    case 'VALIDATION_ERROR':
      return 'Validation failed'
    case 'NETWORK_ERROR':
      return 'Network error'
    case 'TIMEOUT_ERROR':
      return 'Request timeout'
    default:
      return 'Something went wrong'
  }
}

/**
 * Get error description
 */
function getErrorDescription(error: AppError): string | undefined {
  if (error instanceof ValidationError && error.field) {
    return `Field: ${error.field}`
  }

  if (error.context?.details) {
    return typeof error.context.details === 'string'
      ? error.context.details
      : JSON.stringify(error.context.details)
  }

  return error.message !== getErrorMessage(error) ? error.message : undefined
}

/**
 * Get toast duration based on error severity
 */
function getToastDuration(error: AppError): number {
  if (error.statusCode >= 500) return 10000 // 10s for server errors
  if (error.statusCode >= 400) return 5000  // 5s for client errors
  return 3000                                // 3s for others
}

/**
 * Get optional toast action
 */
function getToastAction(error: AppError) {
  // For network errors, offer retry
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
    return {
      label: 'Retry',
      onClick: () => window.location.reload(),
    }
  }

  return undefined
}

// ============================================================================
// ASYNC ERROR HANDLING HELPERS
// ============================================================================

/**
 * Wrap async function with error handling
 * 
 * @example
 * ```typescript
 * const [data, error] = await safeAsync(fetchData())
 * if (error) {
 *   handleError(error)
 * } else {
 *   setData(data)
 * }
 * ```
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[T | null, AppError | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    const appError = normalizeError(error)
    return [null, appError]
  }
}

/**
 * Execute function with automatic error handling
 * 
 * @example
 * ```typescript
 * const result = await withErrorHandler(
 *   () => fetchData(),
 *   { showToast: true }
 * )
 * ```
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  options?: ErrorHandlerOptions
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, options)
    return null
  }
}

/**
 * Retry function with exponential backoff
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on client errors
      if (error instanceof ValidationError || error instanceof AuthError) {
        throw error
      }

      // If last attempt, throw error
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw normalizeError(lastError)
}

// ============================================================================
// SPECIFIC ERROR HANDLERS
// ============================================================================

/**
 * Handle Supabase-specific errors
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) {
    return new AppError('Unknown Supabase error', 'SUPABASE_ERROR', 500)
  }

  // Authentication errors
  if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
    return new AuthError('Invalid authentication')
  }

  // Authorization errors
  if (error.message?.includes('permission denied') || error.status === 403) {
    return new ForbiddenError()
  }

  // Not found errors
  if (error.status === 404 || error.message?.includes('not found')) {
    return new NotFoundError()
  }

  // Validation errors
  if (error.status === 400 || error.message?.includes('violates')) {
    return new ValidationError(error.message || 'Invalid data')
  }

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new AppError('Network error. Please check your connection.', 'NETWORK_ERROR', 0)
  }

  // Default Supabase error
  return new AppError(
    error.message || 'Database error occurred',
    'SUPABASE_ERROR',
    error.status || 500,
    { originalError: error }
  )
}

/**
 * Handle form validation errors
 */
export function handleFormValidation(errors: Record<string, string[]>): ValidationError[] {
  return Object.entries(errors).map(([field, messages]) => {
    return new ValidationError(messages[0], field)
  })
}

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  // Network errors are usually recoverable
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
    return true
  }

  // Temporary server errors might be recoverable
  if (error.statusCode === 503 || error.statusCode === 504) {
    return true
  }

  return false
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Check your internet connection and try again'
    case 'TIMEOUT_ERROR':
      return 'The request took too long. Try again later'
    case 'AUTH_ERROR':
      return 'Please log in again'
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action'
    case 'NOT_FOUND':
      return 'The requested resource does not exist'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again'
    default:
      return 'Please try again or contact support if the problem persists'
  }
}
