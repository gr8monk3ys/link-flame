import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import { getStripe } from '@/lib/stripe-server';
import { getBaseUrl } from '@/lib/url';
import { getOrCreateStripeCustomer } from '@/lib/stripe-subscription';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscription-portal:${identifier}`);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        'Invalid or missing CSRF token',
        'CSRF_VALIDATION_FAILED',
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();
    const { id } = await params;

    if (!userId) {
      return unauthorizedResponse('Please sign in to manage your subscription billing');
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!subscription) {
      return notFoundResponse('Subscription');
    }

    if (subscription.userId !== userId) {
      return forbiddenResponse('You do not have access to this subscription');
    }

    const customerId = await getOrCreateStripeCustomer(userId);
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl()}/account/subscriptions`,
    });

    return successResponse({
      sessionId: portalSession.id,
      sessionUrl: portalSession.url,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
