import { getServerAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { userId } = await getServerAuth();

    return NextResponse.json({
      userId: userId || "guest-user",
      isAuthenticated: !!userId
    });
  } catch (error) {
    logger.error("Auth user check failed", error);
    return handleApiError(error);
  }
}
