/**
 * Centralized logging utility
 *
 * Benefits:
 * - Single place to configure logging behavior
 * - Easy to add external logging services (Sentry, LogRocket, etc.)
 * - Can disable/filter logs in production
 * - Structured logging with consistent format
 * - Request ID tracing for correlating logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

/**
 * Get request ID from a Request object
 * Use this in API routes to extract the request ID header
 */
export function getRequestIdFromRequest(request: Request): string | undefined {
  return request.headers.get('x-request-id') || undefined;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format metadata with optional request ID
   */
  private formatMeta(meta?: LogMeta, requestId?: string): LogMeta | string {
    if (requestId) {
      return { requestId, ...meta };
    }
    return meta || '';
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, meta?: LogMeta): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, this.formatMeta(meta));
    }
  }

  /**
   * Log general information
   */
  info(message: string, meta?: LogMeta): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, this.formatMeta(meta));
    }
    // In production, you might send to a logging service
    // this.sendToLoggingService('info', message, meta);
  }

  /**
   * Log warnings that need attention
   */
  warn(message: string, meta?: LogMeta): void {
    console.warn(`[WARN] ${message}`, this.formatMeta(meta));

    if (this.isProduction) {
      // Send warnings to monitoring service in production
      // this.sendToLoggingService('warn', message, meta);
    }
  }

  /**
   * Log errors that need immediate attention
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    console.error(`[ERROR] ${message}`, errorDetails, this.formatMeta(meta));

    if (this.isProduction) {
      // Send errors to monitoring service in production
      // Example: Sentry, LogRocket, Bugsnag
      // this.sendToLoggingService('error', message, { ...meta, error: errorDetails });
    }
  }

  /**
   * Create a logger context with request ID for consistent logging
   */
  withRequestId(requestId: string | undefined): {
    debug: (message: string, meta?: LogMeta) => void;
    info: (message: string, meta?: LogMeta) => void;
    warn: (message: string, meta?: LogMeta) => void;
    error: (message: string, error?: Error | unknown, meta?: LogMeta) => void;
  } {
    return {
      debug: (message: string, meta?: LogMeta) => {
        if (this.isDevelopment) {
          console.log(`[DEBUG] ${message}`, this.formatMeta(meta, requestId));
        }
      },
      info: (message: string, meta?: LogMeta) => {
        if (this.isDevelopment) {
          console.log(`[INFO] ${message}`, this.formatMeta(meta, requestId));
        }
      },
      warn: (message: string, meta?: LogMeta) => {
        console.warn(`[WARN] ${message}`, this.formatMeta(meta, requestId));
      },
      error: (message: string, error?: Error | unknown, meta?: LogMeta) => {
        const errorDetails = error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error;
        console.error(`[ERROR] ${message}`, errorDetails, this.formatMeta(meta, requestId));
      },
    };
  }

  /**
   * Log API requests (useful for debugging and monitoring)
   */
  apiRequest(method: string, path: string, meta?: LogMeta): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${path}`, meta || '');
    }
  }

  /**
   * Log API responses with timing
   */
  apiResponse(method: string, path: string, status: number, duration: number, meta?: LogMeta): void {
    const level = status >= 400 ? 'error' : 'info';

    if (this.isDevelopment || status >= 400) {
      console.log(`[API] ${method} ${path} - ${status} (${duration}ms)`, meta || '');
    }

    if (this.isProduction && status >= 500) {
      // Track 5xx errors in production
      // this.sendToLoggingService('error', `API Error: ${method} ${path}`, { status, duration, ...meta });
    }
  }

  /**
   * Placeholder for future logging service integration
   * Uncomment and implement when adding Sentry, LogRocket, etc.
   */
  // private async sendToLoggingService(level: LogLevel, message: string, meta?: LogMeta): Promise<void> {
  //   try {
  //     // Example: Sentry integration
  //     // Sentry.captureMessage(message, { level, extra: meta });
  //
  //     // Example: Custom logging API
  //     // await fetch('/api/logs', {
  //     //   method: 'POST',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() })
  //     // });
  //   } catch (err) {
  //     // Fail silently to avoid breaking app if logging service is down
  //     console.error('Failed to send log to service:', err);
  //   }
  // }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports for common patterns
export const logError = (message: string, error?: Error | unknown, meta?: LogMeta) =>
  logger.error(message, error, meta);

export const logWarn = (message: string, meta?: LogMeta) =>
  logger.warn(message, meta);

export const logInfo = (message: string, meta?: LogMeta) =>
  logger.info(message, meta);

export const logDebug = (message: string, meta?: LogMeta) =>
  logger.debug(message, meta);
