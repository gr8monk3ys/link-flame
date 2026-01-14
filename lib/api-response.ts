import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Standard pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, any>,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  code?: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a validation error response from Zod errors
 */
export function validationErrorResponse(
  error: ZodError,
  status: number = 400
): NextResponse<ApiResponse> {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: formattedErrors,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination,
      },
    },
    { status }
  );
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
} as const;

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  logger.error("API error occurred", error);

  // Zod validation error
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  // Known error with message
  if (error instanceof Error) {
    return errorResponse(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      undefined,
      500
    );
  }

  // Unknown error
  return errorResponse(
    "An unexpected error occurred",
    ErrorCodes.INTERNAL_ERROR,
    undefined,
    500
  );
}

/**
 * Utility function for rate limit errors
 */
export function rateLimitErrorResponse(
  reset: number
): NextResponse<ApiResponse> {
  const retryAfter = Math.floor((reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Too many requests. Please try again later.",
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        details: {
          retryAfter,
          resetAt: new Date(reset).toISOString(),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/**
 * Utility function for unauthorized errors
 */
export function unauthorizedResponse(
  message: string = "Authentication required"
): NextResponse<ApiResponse> {
  return errorResponse(
    message,
    ErrorCodes.AUTHENTICATION_ERROR,
    undefined,
    401
  );
}

/**
 * Utility function for forbidden errors
 */
export function forbiddenResponse(
  message: string = "You don't have permission to access this resource"
): NextResponse<ApiResponse> {
  return errorResponse(
    message,
    ErrorCodes.AUTHORIZATION_ERROR,
    undefined,
    403
  );
}

/**
 * Utility function for not found errors
 */
export function notFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiResponse> {
  return errorResponse(
    `${resource} not found`,
    ErrorCodes.NOT_FOUND,
    undefined,
    404
  );
}

/**
 * Utility function for conflict errors (409)
 * Use when the request conflicts with the current state of the resource
 * Examples: duplicate email, resource already exists
 */
export function conflictResponse(
  message: string = "Resource already exists"
): NextResponse<ApiResponse> {
  return errorResponse(
    message,
    ErrorCodes.CONFLICT,
    undefined,
    409
  );
}
