/**
 * Quiz Results API
 *
 * GET /api/quiz/results/[id] - Get saved quiz results by visible ID
 */

import { NextRequest } from 'next/server';
import { getQuizResponseByVisibleId } from '@/lib/quiz';
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { id } = await params;

    if (!id) {
      return notFoundResponse('Quiz result');
    }

    const result = await getQuizResponseByVisibleId(id);

    if (!result) {
      return notFoundResponse('Quiz result');
    }

    return successResponse({
      visibleId: result.visibleId,
      responses: result.responses,
      recommendations: result.products,
      totalRecommendations: result.products.length,
      completedAt: result.completedAt,
    });
  } catch (error) {
    logger.error('Failed to fetch quiz results', error);
    return handleApiError(error);
  }
}
