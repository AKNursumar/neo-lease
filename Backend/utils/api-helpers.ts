import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  validation_errors?: Array<{ field: string; message: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// Success response helper
export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  pagination?: ApiResponse<T>['pagination']
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination,
  };

  res.status(statusCode).json(response);
}

// Error response helper
export function errorResponse(
  res: NextApiResponse,
  error: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string,
  validationErrors?: Array<{ field: string; message: string }>
): void {
  const response: ApiResponse = {
    success: false,
    error,
    code,
    validation_errors: validationErrors,
  };

  res.status(statusCode).json(response);
}

// Validation error response helper
export function validationErrorResponse(
  res: NextApiResponse,
  errors: Array<{ field: string; message: string }>
): void {
  errorResponse(
    res,
    'Validation failed',
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    ERROR_CODES.VALIDATION_ERROR,
    errors
  );
}

// Not found response helper
export function notFoundResponse(res: NextApiResponse, resource: string = 'Resource'): void {
  errorResponse(
    res,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
}

// Unauthorized response helper
export function unauthorizedResponse(res: NextApiResponse, message: string = 'Unauthorized'): void {
  errorResponse(
    res,
    message,
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.UNAUTHORIZED
  );
}

// Forbidden response helper
export function forbiddenResponse(res: NextApiResponse, message: string = 'Forbidden'): void {
  errorResponse(
    res,
    message,
    HTTP_STATUS.FORBIDDEN,
    ERROR_CODES.FORBIDDEN
  );
}

// Method not allowed response helper
export function methodNotAllowedResponse(
  res: NextApiResponse,
  allowedMethods: string[] = []
): void {
  res.setHeader('Allow', allowedMethods.join(', '));
  errorResponse(
    res,
    'Method not allowed',
    HTTP_STATUS.METHOD_NOT_ALLOWED
  );
}

// Rate limit exceeded response helper
export function rateLimitResponse(res: NextApiResponse): void {
  errorResponse(
    res,
    'Rate limit exceeded. Please try again later.',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    ERROR_CODES.RATE_LIMIT_EXCEEDED
  );
}

// Helper to handle method filtering
export function withMethods(allowedMethods: string[]) {
  return function (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!allowedMethods.includes(req.method || '')) {
        return methodNotAllowedResponse(res, allowedMethods);
      }

      return handler(req, res);
    };
  };
}

// Helper to catch async errors
export function withErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't send error response if headers are already sent
      if (res.headersSent) {
        return;
      }

      errorResponse(
        res,
        'Internal server error',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  };
}

// Helper to validate request body with Zod schema
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return function (req: NextApiRequest): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
    try {
      const result = schema.safeParse(req.body);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors = result.error.errors.map((error: any) => ({
          field: error.path.join('.'),
          message: error.message,
        }));
        return { success: false, errors };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: [{ field: 'body', message: 'Invalid request body' }] 
      };
    }
  };
}

// Helper to validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return function (req: NextApiRequest): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
    try {
      const result = schema.safeParse(req.query);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors = result.error.errors.map((error: any) => ({
          field: error.path.join('.'),
          message: error.message,
        }));
        return { success: false, errors };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: [{ field: 'query', message: 'Invalid query parameters' }] 
      };
    }
  };
}

// Helper to create pagination info
export function createPagination(
  page: number,
  limit: number,
  total: number
): ApiResponse['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
}

// Helper to get pagination offset
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Helper to parse boolean query parameter
export function parseBoolean(value: string | string[] | undefined, defaultValue: boolean = false): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
}

// Helper to parse number query parameter
export function parseNumber(value: string | string[] | undefined, defaultValue?: number): number | undefined {
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

// Helper to parse array query parameter
export function parseArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

// Helper to sanitize file name
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

// Helper to generate unique file name
export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = sanitizeFileName(originalName);
  const extension = sanitized.split('.').pop();
  const nameWithoutExt = sanitized.replace(`.${extension}`, '');
  
  const uniqueName = `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
  return prefix ? `${prefix}/${uniqueName}` : uniqueName;
}

// Helper to check if request is from localhost (for development)
export function isLocalhost(req: NextApiRequest): boolean {
  const host = req.headers.host;
  return host ? host.includes('localhost') || host.includes('127.0.0.1') : false;
}

// Helper to get client IP address
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress;
  
  return ip || 'unknown';
}

// Helper to log API request
export function logRequest(req: NextApiRequest, userId?: string): void {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - User: ${userId || 'anonymous'} - UA: ${userAgent}`);
}