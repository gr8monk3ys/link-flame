import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string
  message: string
  code: string
}

/**
 * Rate limit error detail structure
 */
export interface RateLimitErrorDetail {
  retryAfter: number
  resetAt: string
}

/**
 * Union type for known error details
 * Extensible for future error types
 */
export type ErrorDetails =
  | ValidationErrorDetail[]
  | RateLimitErrorDetail
  | Record<string, unknown>
  | undefined

/**
 * API error structure with typed details
 */
export interface ApiError<D = ErrorDetails> {
  message: string
  code?: string
  details?: D
}

/**
 * Base response meta always includes timestamp
 */
export interface ResponseMeta {
  timestamp: string
  [key: string]: unknown
}

/**
 * Standard API response structure
 * @template T - The type of the data payload (defaults to unknown)
 * @template D - Error details type (defaults to ErrorDetails)
 */
export interface ApiResponse<T = unknown, D = ErrorDetails> {
  success: boolean
  data?: T
  error?: ApiError<D>
  meta?: ResponseMeta
}

/**
 * Standard pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Create a successful API response
 * @template T - The type of the data payload
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
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
  )
}

/**
 * Create an error API response
 * @template D - Error details type
 */
export function errorResponse<D = undefined>(
  message: string,
  code?: string,
  details?: D,
  status: number = 400
): NextResponse<ApiResponse<never, D>> {
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
  )
}

/**
 * Create a validation error response from Zod errors
 */
export function validationErrorResponse(
  error: ZodError,
  status: number = 400
): NextResponse<ApiResponse<never, ValidationErrorDetail[]>> {
  const formattedErrors: ValidationErrorDetail[] = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

/**
 * Create a paginated response
 * @template T - The type of items in the data array
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
  )
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  logger.error('API error occurred', error)

  // Zod validation error
  if (error instanceof ZodError) {
    return validationErrorResponse(error)
  }

  // Known error with message
  if (error instanceof Error) {
    return errorResponse(error.message, ErrorCodes.INTERNAL_ERROR, undefined, 500)
  }

  // Unknown error
  return errorResponse('An unexpected error occurred', ErrorCodes.INTERNAL_ERROR, undefined, 500)
}

/**
 * Utility function for rate limit errors
 */
export function rateLimitErrorResponse(
  reset: number
): NextResponse<ApiResponse<never, RateLimitErrorDetail>> {
  const retryAfter = Math.floor((reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
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
        'Retry-After': String(retryAfter),
      },
    }
  )
}

/**
 * Utility function for unauthorized errors
 */
export function unauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, ErrorCodes.AUTHENTICATION_ERROR, undefined, 401)
}

/**
 * Utility function for forbidden errors
 */
export function forbiddenResponse(
  message: string = "You don't have permission to access this resource"
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, ErrorCodes.AUTHORIZATION_ERROR, undefined, 403)
}

/**
 * Utility function for not found errors
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse<never>> {
  return errorResponse(`${resource} not found`, ErrorCodes.NOT_FOUND, undefined, 404)
}

/**
 * Utility function for conflict errors (409)
 * Use when the request conflicts with the current state of the resource
 * Examples: duplicate email, resource already exists
 */
export function conflictResponse(
  message: string = 'Resource already exists'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, ErrorCodes.CONFLICT, undefined, 409)
}
