import { Response } from 'express';
import { z } from 'zod';
import { logger } from './logger';


export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleError = (
  error: unknown,
  res: Response,
  context: string,
  requestId?: string
): void => {
  // Log the full error for debugging (server-side only)
  logger.error(`Error in ${context}:`, {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    requestId,
    context,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types with sanitized client responses
  if (error instanceof ApiError) {
    const response: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };
    
    if (error.details) {
      response.details = sanitizeErrorDetails(error.details);
    }
    
    res.status(error.statusCode).json(response);
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues.map(issue => ({
        field: issue.path.join('.') || 'root',
        message: sanitizeValidationMessage(issue.message)
      }))
    });
    return;
  }

  // For unknown errors, return generic message
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId
  });
};

const sanitizeErrorDetails = (details: unknown): unknown => {
  if (typeof details === 'string') {
    // Remove file paths, stack traces, and other sensitive info
    return details
      .replace(/\/[^\s]+/g, '[PATH_REDACTED]') // Remove file paths
      .replace(/at\s+[^\n]+/g, '[STACK_REDACTED]') // Remove stack trace lines
      .replace(/Error:\s*/, ''); // Remove "Error:" prefix
  }
  
  if (Array.isArray(details)) {
    return details.map(item => sanitizeErrorDetails(item));
  }
  
  if (details && typeof details === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      // Skip sensitive keys
      if (['stack', 'path', 'filename', 'syscall'].includes(key)) {
        continue;
      }
      sanitized[key] = sanitizeErrorDetails(value);
    }
    return sanitized;
  }
  
  return details;
};

const sanitizeValidationMessage = (message: string): string => {
  // Keep validation messages but remove any potential file paths
  return message.replace(/\/[^\s]+/g, '[PATH]');
};

export const createGenericError = (context: string): ApiError => {
  return new ApiError(`Operation failed in ${context}`, 500, 'OPERATION_FAILED');
};