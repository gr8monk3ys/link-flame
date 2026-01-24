/**
 * Quiz Questions API
 *
 * GET /api/quiz/questions - Get all active quiz questions
 */

import { NextRequest } from 'next/server';
import { getActiveQuizQuestions } from '@/lib/quiz';
import { successResponse, handleApiError, rateLimitErrorResponse } from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const questions = await getActiveQuizQuestions();

    return successResponse({
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    logger.error('Failed to fetch quiz questions', error);
    return handleApiError(error);
  }
}
