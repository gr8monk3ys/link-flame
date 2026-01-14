import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  handleApiError,
  rateLimitErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  ErrorCodes,
  type PaginationMeta,
} from '@/lib/api-response';

describe('API Response Helpers', () => {
  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('successResponse', () => {
    it('should create a successful response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta).toHaveProperty('timestamp');
    });

    it('should accept custom status code', async () => {
      const data = { id: 1 };
      const response = successResponse(data, undefined, 201);

      expect(response.status).toBe(201);
    });

    it('should include additional meta information', async () => {
      const data = { id: 1 };
      const meta = { customField: 'value', count: 5 };
      const response = successResponse(data, meta);
      const body = await response.json();

      expect(body.meta).toHaveProperty('timestamp');
      expect(body.meta).toHaveProperty('customField', 'value');
      expect(body.meta).toHaveProperty('count', 5);
    });

    it('should handle different data types', async () => {
      // Array
      const arrayResponse = successResponse([1, 2, 3]);
      const arrayBody = await arrayResponse.json();
      expect(arrayBody.data).toEqual([1, 2, 3]);

      // String
      const stringResponse = successResponse('hello');
      const stringBody = await stringResponse.json();
      expect(stringBody.data).toBe('hello');

      // Number
      const numberResponse = successResponse(42);
      const numberBody = await numberResponse.json();
      expect(numberBody.data).toBe(42);

      // Null
      const nullResponse = successResponse(null);
      const nullBody = await nullResponse.json();
      expect(nullBody.data).toBe(null);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', async () => {
      const response = errorResponse('Something went wrong', 'ERROR_CODE');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toEqual({
        message: 'Something went wrong',
        code: 'ERROR_CODE',
        details: undefined,
      });
      expect(body.meta).toHaveProperty('timestamp');
    });

    it('should accept custom status code', async () => {
      const response = errorResponse('Error', 'CODE', undefined, 500);

      expect(response.status).toBe(500);
    });

    it('should include error details', async () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = errorResponse('Validation failed', 'VALIDATION', details);
      const body = await response.json();

      expect(body.error?.details).toEqual(details);
    });

    it('should work without code and details', async () => {
      const response = errorResponse('Simple error');
      const body = await response.json();

      expect(body.error?.message).toBe('Simple error');
      expect(body.error?.code).toBeUndefined();
      expect(body.error?.details).toBeUndefined();
    });
  });

  describe('validationErrorResponse', () => {
    it('should format Zod validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
        email: z.string().email(),
      });

      try {
        schema.parse({ name: 'ab', age: 15, email: 'invalid' });
      } catch (error) {
        const response = validationErrorResponse(error as ZodError);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error?.code).toBe('VALIDATION_ERROR');
        expect(body.error?.message).toBe('Validation failed');
        expect(body.error?.details).toBeInstanceOf(Array);
        expect(body.error?.details.length).toBeGreaterThan(0);

        // Check error structure
        const firstError = body.error?.details[0];
        expect(firstError).toHaveProperty('field');
        expect(firstError).toHaveProperty('message');
        expect(firstError).toHaveProperty('code');
      }
    });

    it('should handle nested field errors', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(3),
          }),
        }),
      });

      try {
        schema.parse({ user: { profile: { name: 'ab' } } });
      } catch (error) {
        const response = validationErrorResponse(error as ZodError);
        const body = await response.json();

        const errorDetails = body.error?.details;
        expect(errorDetails[0].field).toBe('user.profile.name');
      }
    });
  });

  describe('paginatedResponse', () => {
    it('should create a paginated response', async () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const pagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      };

      const response = paginatedResponse(data, pagination);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta?.pagination).toEqual(pagination);
      expect(body.meta).toHaveProperty('timestamp');
    });

    it('should handle empty data arrays', async () => {
      const pagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      const response = paginatedResponse([], pagination);
      const body = await response.json();

      expect(body.data).toEqual([]);
      expect(body.meta?.pagination.total).toBe(0);
    });
  });

  describe('handleApiError', () => {
    it('should handle ZodError', async () => {
      const schema = z.object({ name: z.string() });

      try {
        schema.parse({ name: 123 });
      } catch (error) {
        const response = handleApiError(error);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error?.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle standard Error objects', async () => {
      const error = new Error('Test error message');
      const response = handleApiError(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error?.message).toBe('Test error message');
      expect(body.error?.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should handle unknown errors', async () => {
      const response = handleApiError('unknown error');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error?.message).toBe('An unexpected error occurred');
      expect(body.error?.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should log errors to console', () => {
      const error = new Error('Test');
      handleApiError(error);

      // Logger formats output as "[ERROR] message" with error details
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.objectContaining({ message: 'Test' }),
        expect.anything()
      );
    });
  });

  describe('rateLimitErrorResponse', () => {
    it('should create rate limit error with retry information', async () => {
      const resetTime = Date.now() + 60000; // 60 seconds from now
      const response = rateLimitErrorResponse(resetTime);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error?.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(body.error?.message).toContain('Too many requests');
      expect(body.error?.details).toHaveProperty('retryAfter');
      expect(body.error?.details).toHaveProperty('resetAt');

      // Check Retry-After header
      const retryAfter = response.headers.get('Retry-After');
      expect(retryAfter).toBeTruthy();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });

    it('should calculate correct retry-after seconds', async () => {
      const resetTime = Date.now() + 120000; // 120 seconds from now
      const response = rateLimitErrorResponse(resetTime);
      const body = await response.json();

      const retryAfter = body.error?.details.retryAfter;
      expect(retryAfter).toBeGreaterThanOrEqual(119); // Allow 1 second tolerance
      expect(retryAfter).toBeLessThanOrEqual(120);
    });
  });

  describe('unauthorizedResponse', () => {
    it('should create unauthorized error with default message', async () => {
      const response = unauthorizedResponse();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error?.message).toBe('Authentication required');
      expect(body.error?.code).toBe(ErrorCodes.AUTHENTICATION_ERROR);
    });

    it('should accept custom message', async () => {
      const response = unauthorizedResponse('Invalid token');
      const body = await response.json();

      expect(body.error?.message).toBe('Invalid token');
    });
  });

  describe('forbiddenResponse', () => {
    it('should create forbidden error with default message', async () => {
      const response = forbiddenResponse();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error?.message).toContain("don't have permission");
      expect(body.error?.code).toBe(ErrorCodes.AUTHORIZATION_ERROR);
    });

    it('should accept custom message', async () => {
      const response = forbiddenResponse('Admin only');
      const body = await response.json();

      expect(body.error?.message).toBe('Admin only');
    });
  });

  describe('notFoundResponse', () => {
    it('should create not found error with default resource', async () => {
      const response = notFoundResponse();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error?.message).toBe('Resource not found');
      expect(body.error?.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should accept custom resource name', async () => {
      const response = notFoundResponse('User');
      const body = await response.json();

      expect(body.error?.message).toBe('User not found');
    });
  });

  describe('ErrorCodes', () => {
    it('should export all standard error codes', () => {
      expect(ErrorCodes).toHaveProperty('VALIDATION_ERROR');
      expect(ErrorCodes).toHaveProperty('AUTHENTICATION_ERROR');
      expect(ErrorCodes).toHaveProperty('AUTHORIZATION_ERROR');
      expect(ErrorCodes).toHaveProperty('NOT_FOUND');
      expect(ErrorCodes).toHaveProperty('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes).toHaveProperty('INTERNAL_ERROR');
      expect(ErrorCodes).toHaveProperty('BAD_REQUEST');
      expect(ErrorCodes).toHaveProperty('CONFLICT');
    });
  });
});
