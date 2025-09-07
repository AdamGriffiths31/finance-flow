/**
 * Structured logging interface for the finance-flow backend
 * Provides consistent logging with correlation IDs and metadata
 */

export interface Logger {
  /**
   * Log informational message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  info(message: string, meta?: LogMetadata): void;
  
  /**
   * Log error message
   * @param message - Error message
   * @param error - Optional error object
   * @param meta - Optional metadata
   */
  error(message: string, error?: Error | unknown, meta?: LogMetadata): void;
  
  /**
   * Log warning message
   * @param message - Warning message
   * @param meta - Optional metadata
   */
  warn(message: string, meta?: LogMetadata): void;
  
  /**
   * Log debug message (only in development)
   * @param message - Debug message
   * @param meta - Optional metadata
   */
  debug(message: string, meta?: LogMetadata): void;
}

export interface LogMetadata {
  requestId?: string;
  context?: string;
  timestamp?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Console-based logger implementation
 * In production, this would be replaced with a proper logging library like Winston
 */
class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, meta?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const requestId = meta?.requestId ? `[${meta.requestId}]` : '';
    const context = meta?.context ? `[${meta.context}]` : '';
    
    return `${timestamp} ${level} ${requestId}${context} ${message}`;
  }

  private formatMetadata(meta?: LogMetadata): string {
    if (!meta || Object.keys(meta).length === 0) {
      return '';
    }

    const filteredMeta = { ...meta };
    // Remove already formatted fields
    delete filteredMeta.requestId;
    delete filteredMeta.context;
    delete filteredMeta.timestamp;

    if (Object.keys(filteredMeta).length === 0) {
      return '';
    }

    try {
      return '\n' + JSON.stringify(filteredMeta, null, 2);
    } catch {
      return '';
    }
  }

  info(message: string, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('[INFO]', message, meta);
    const metaString = this.formatMetadata(meta);
    // eslint-disable-next-line no-console
    console.log(formattedMessage + metaString);
  }

  error(message: string, error?: Error | unknown, meta?: LogMetadata): void {
    const errorMeta: LogMetadata = { ...meta };
    
    if (error instanceof Error) {
      errorMeta.error = error.message;
      errorMeta.stack = error.stack;
    } else if (error) {
      errorMeta.error = String(error);
    }

    const formattedMessage = this.formatMessage('[ERROR]', message, errorMeta);
    const metaString = this.formatMetadata(errorMeta);
    // eslint-disable-next-line no-console
    console.error(formattedMessage + metaString);
  }

  warn(message: string, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('[WARN]', message, meta);
    const metaString = this.formatMetadata(meta);
    // eslint-disable-next-line no-console
    console.warn(formattedMessage + metaString);
  }

  debug(message: string, meta?: LogMetadata): void {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      const formattedMessage = this.formatMessage('[DEBUG]', message, meta);
      const metaString = this.formatMetadata(meta);
      // eslint-disable-next-line no-console
      console.log(formattedMessage + metaString);
    }
  }
}

/**
 * Mock logger for testing purposes
 */
export class MockLogger implements Logger {
  public logs: Array<{ level: string; message: string; meta?: LogMetadata; error?: unknown }> = [];

  info(message: string, meta?: LogMetadata): void {
    this.logs.push({ level: 'info', message, meta });
  }

  error(message: string, error?: Error | unknown, meta?: LogMetadata): void {
    this.logs.push({ level: 'error', message, meta, error });
  }

  warn(message: string, meta?: LogMetadata): void {
    this.logs.push({ level: 'warn', message, meta });
  }

  debug(message: string, meta?: LogMetadata): void {
    this.logs.push({ level: 'debug', message, meta });
  }

  clear(): void {
    this.logs = [];
  }
}

// Export the default logger instance
export const logger: Logger = new ConsoleLogger();