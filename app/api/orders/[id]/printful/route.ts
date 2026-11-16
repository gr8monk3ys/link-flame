import { getServerAuth, requireRole } from "@/lib/auth";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { submitPrintfulOrder } from "@/lib/printful";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/printful
 *
 * Admin only. Re-sends a paid order's print-on-demand lines to Printful,
 * for example after a missing API key or a bad address made the first
 * attempt fail. Safe to repeat: an order that already has a Printful id is
 * left alone.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) return unauthorizedResponse("You must be logged in");

    if (!(await validateCsrfToken(req))) return forbiddenResponse("Invalid or missing CSRF token");
    if (!(await requireRole(userId, ["ADMIN"]))) return forbiddenResponse("Admin access required");

    const { success, reset } = await checkRateLimit(getIdentifier(req, userId));
    if (!success) return rateLimitErrorResponse(reset);

    const { id } = await params;
    const result = await submitPrintfulOrder(id);
    if (result.status === "failed") {
      return errorResponse(result.error, "PRINTFUL_SUBMIT_FAILED", undefined, 502);
    }
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
