/**
 * Standardized Pagination Utilities
 *
 * This module provides consistent pagination handling across all API endpoints.
 * It standardizes request parsing, response formatting, and validation.
 *
 * @module lib/api/pagination
 */

import { z } from 'zod'

/**
 * Default pagination configuration
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const

/**
 * Pagination metadata included in paginated responses
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
 * Standardized paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

/**
 * Zod schema for pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page cannot exceed 10000')
    .default(PAGINATION_DEFAULTS.page),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(PAGINATION_DEFAULTS.maxLimit, `Limit cannot exceed ${PAGINATION_DEFAULTS.maxLimit}`)
    .default(PAGINATION_DEFAULTS.limit),
})

/**
 * Parses pagination parameters from a URL's search params.
 *
 * @param searchParams - URLSearchParams object from the request URL
 * @returns Parsed and validated pagination parameters with offset
 *
 * @example
 * ```typescript
 * const url = new URL(request.url)
 * const { page, limit, offset } = parsePaginationParams(url.searchParams)
 *
 * const items = await prisma.product.findMany({
 *   skip: offset,
 *   take: limit,
 * })
 * ```
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = parseInt(searchParams.get('page') || String(PAGINATION_DEFAULTS.page), 10)
  const limit = Math.min(
    parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULTS.limit), 10),
    PAGINATION_DEFAULTS.maxLimit
  )

  // Ensure values are within bounds
  const validPage = Math.max(1, page)
  const validLimit = Math.max(1, Math.min(limit, PAGINATION_DEFAULTS.maxLimit))

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  }
}

/**
 * Calculates pagination metadata from the total count and current page info.
 *
 * @param total - Total number of items matching the query
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Pagination metadata object
 *
 * @example
 * ```typescript
 * const total = await prisma.product.count({ where })
 * const pagination = calculatePaginationMeta(total, 2, 20)
 * // Returns: { page: 2, limit: 20, total: 100, totalPages: 5, hasNextPage: true, hasPreviousPage: true }
 * ```
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Creates a standardized paginated response object.
 *
 * This function wraps an array of data with pagination metadata,
 * providing a consistent response format across all paginated endpoints.
 *
 * @template T - The type of items in the data array
 * @param data - Array of items for the current page
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param total - Total number of items matching the query
 * @returns Standardized paginated response object
 *
 * @example
 * ```typescript
 * const products = await prisma.product.findMany({
 *   where,
 *   skip: offset,
 *   take: limit,
 * })
 * const total = await prisma.product.count({ where })
 *
 * return successResponse(
 *   paginatedResponse(products, page, limit, total)
 * )
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePaginationMeta(total, page, limit),
  }
}

/**
 * Calculates the offset for database queries based on page and limit.
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns The offset value for skip/offset queries
 *
 * @example
 * ```typescript
 * const offset = calculateOffset(3, 20)
 * // Returns: 40 (skip first 40 items to get page 3)
 * ```
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Generates cursor-based pagination info (for future use).
 *
 * @template T - The type of items being paginated
 * @param items - Array of items returned from the query
 * @param cursorField - The field to use as cursor (e.g., 'id', 'createdAt')
 * @returns Cursor-based pagination info
 */
export function getCursorPaginationInfo<T extends Record<string, unknown>>(
  items: T[],
  cursorField: keyof T
): { nextCursor: string | null; hasMore: boolean } {
  if (items.length === 0) {
    return { nextCursor: null, hasMore: false }
  }

  const lastItem = items[items.length - 1]
  const cursorValue = lastItem[cursorField]

  return {
    nextCursor: cursorValue !== undefined ? String(cursorValue) : null,
    hasMore: items.length > 0, // This should be checked with limit + 1 query pattern
  }
}
