import { handlers } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit';
import { rateLimitErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic'

// Wrap POST handler with rate limiting for signin/signup
async function POST(request: NextRequest) {
  // Only rate limit signin requests (callback/credentials/credentials)
  const url = new URL(request.url);
  const isSignIn = url.pathname.includes('/callback/credentials');

  if (isSignIn) {
    // Rate limiting: 5 requests per minute for signin attempts
    const identifier = getIdentifier(request);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }
  }

  // Pass through to NextAuth handler
  return handlers.POST(request);
}

// GET handler doesn't need rate limiting
const { GET } = handlers;

export { GET, POST };
