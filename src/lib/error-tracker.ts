/**
 * Error Tracking System for FORMA
 * Simulates Sentry behavior using console.error
 */

type LogLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface UserContext {
  id: string;
  email?: string;
  username?: string;
}

interface Transaction {
  name: string;
  op?: string;
  startTime: number;
  end(): void;
}

interface ErrorContext {
  [key: string]: unknown;
}

// Global state for tracking
let currentUser: UserContext | null = null;

/**
 * Get common metadata for error context
 */
function getCommonMetadata(): Record<string, unknown> {
  return {
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    timestamp: new Date().toISOString(),
    ...(currentUser ? { userId: currentUser.id } : {}),
  };
}

/**
 * Format error for console output (simulating Sentry format)
 */
function formatErrorPayload(type: string, data: Record<string, unknown>): void {
  console.error(JSON.stringify({
    event_id: crypto.randomUUID?.() || `evt_${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    ...data,
  }, null, 2));
}

/**
 * Capture an error with optional context
 * @param error - The error object to capture
 * @param context - Optional context metadata
 */
export function captureError(error: Error, context?: ErrorContext): void {
  const errorData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    extra: context || {},
    ...getCommonMetadata(),
  };

  formatErrorPayload('error', errorData);
}

/**
 * Capture a log message at specified severity level
 * @param message - The message to capture
 * @param level - Severity level (default: info)
 */
export function captureMessage(message: string, level: LogLevel = 'info'): void {
  const messageData = {
    level,
    message,
    ...getCommonMetadata(),
  };

  formatErrorPayload('message', messageData);
}

/**
 * Set user context for current scope
 * @param user - User object with id and optional email/username
 */
export function addUser(user: UserContext): void {
  currentUser = user;
  console.error(JSON.stringify({
    type: 'user_context',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    timestamp: new Date().toISOString(),
  }, null, 2));
}

/**
 * Start a performance transaction for measuring operation duration
 * @param name - Transaction name
 * @param op - Operation type
 * @returns Transaction object or undefined if not in browser
 */
export function startTransaction(name: string, op?: string): Transaction | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const startTime = performance.now();

  console.error(JSON.stringify({
    type: 'transaction_start',
    transaction: {
      name,
      op,
    },
    timestamp: new Date().toISOString(),
  }, null, 2));

  return {
    name,
    op,
    startTime,
    end() {
      const duration = performance.now() - startTime;
      console.error(JSON.stringify({
        type: 'transaction_end',
        transaction: {
          name,
          op,
          duration: `${duration.toFixed(2)}ms`,
        },
        timestamp: new Date().toISOString(),
      }, null, 2));
    },
  };
}

/**
 * Initialize global error handlers
 * Call this at app startup to capture unhandled errors
 */
export function initErrorTracking(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Capture unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    captureError(error || new Error(String(message)), {
      source,
      lineno,
      colno,
    });
    return false;
  };

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    captureError(error, { unhandledRejection: true });
  });

  console.error(JSON.stringify({
    type: 'error_tracker_initialized',
    timestamp: new Date().toISOString(),
  }, null, 2));
}

/**
 * Add a breadcrumb for user action tracking
 * @param category - Breadcrumb category
 * @param message - Breadcrumb message
 * @param data - Optional additional data
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    type: 'breadcrumb',
    category,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, null, 2));
}