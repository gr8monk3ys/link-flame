/**
 * Quiz Submission API
 *
 * POST /api/quiz/submit - Submit quiz answers and get personalized recommendations
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerAuth } from '@/lib/auth';
import { getGuestSessionId } from '@/lib/session';
import { saveQuizResponse } from '@/lib/quiz';
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { rateLimitErrorResponse } from '@/lib/api-response';
import { validateCsrfToken } from '@/lib/csrf';

// Schema for quiz submission
const submitSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string())])
  ).refine(
    (obj) => Object.keys(obj).length >= 1,
    { message: 'At least one question must be answered' }
  ),
});

export async function POST(request: NextRequest) {
  // CSRF protection for quiz submissions
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return errorResponse(
      "Invalid or missing CSRF token",
      "CSRF_VALIDATION_FAILED",
      undefined,
      403
    );
  }

  // Rate limit to prevent abuse
  const identifier = getIdentifier(request);
  const { success, reset } = await checkRateLimit(`quiz_submit:${identifier}`);

  if (!success) {
    return rateLimitErrorResponse(reset);
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { responses } = validation.data;

    // Get user ID if authenticated, otherwise use guest session
    const { userId } = await getServerAuth();
    const sessionId = userId ? null : await getGuestSessionId();

    // Save quiz response and get recommendations
    const { visibleId, products } = await saveQuizResponse(
      responses,
      sessionId,
      userId
    );

    logger.info('Quiz submitted successfully', {
      visibleId,
      userId: userId || 'guest',
      responseCount: Object.keys(responses).length,
      recommendationCount: products.length,
    });

    return successResponse({
      visibleId,
      resultsUrl: `/quiz/results/${visibleId}`,
      recommendations: products,
      totalRecommendations: products.length,
    }, undefined, 201);
  } catch (error) {
    logger.error('Failed to submit quiz', error);
    return handleApiError(error);
  }
}
