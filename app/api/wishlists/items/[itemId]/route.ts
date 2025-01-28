import { getServerAuth } from "@/lib/auth";
import { getUserIdForCart } from "@/lib/session";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { z } from "zod";
import {
  successResponse,
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { updateSavedItemNote } from "@/lib/wishlists";

export const dynamic = 'force-dynamic'

const UpdateSavedItemNoteSchema = z.object({
  note: z.string().max(500).nullable().optional(),
});

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

/**
 * PATCH /api/wishlists/items/[itemId]
 *
 * Update note metadata for an existing saved item.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const csrfValid = await validateCsrfToken(req);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { itemId } = await params;
    const { userId: authUserId } = await getServerAuth();

    const identifier = getIdentifier(req, authUserId);
    const { success, reset } = await checkRateLimit(identifier);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await req.json();
    const validation = UpdateSavedItemNoteSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const userIdToUse = await getUserIdForCart(authUserId);
    const note = validation.data.note ?? null;
    const result = await updateSavedItemNote(itemId, userIdToUse, note);

    if (!result.success) {
      if (result.error === "Item not found") {
        return notFoundResponse("Saved item");
      }
      return errorResponse(result.error || "Failed to update saved item note", undefined, undefined, 400);
    }

    logger.info("Saved item note updated", {
      userId: userIdToUse,
      itemId,
      hasNote: Boolean(result.item?.note),
    });

    return successResponse({
      id: result.item!.id,
      productId: result.item!.productId,
      note: result.item!.note,
      addedAt: result.item!.addedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update saved item note", error);
    return handleApiError(error);
  }
}
