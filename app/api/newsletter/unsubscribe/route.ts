import { checkStrictRateLimit, getIdentifier } from "@/lib/rate-limit"
import { validateCsrfToken } from "@/lib/csrf"
import { prisma } from "@/lib/prisma"
import { verifyUnsubscribeToken } from "@/lib/newsletter-token"
import { z } from "zod"
import {
  successResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  handleApiError,
  errorResponse,
  ErrorCodes,
} from "@/lib/api-response"

export const dynamic = 'force-dynamic'

const UnsubscribeSchema = z.object({
  id: z.string().min(1).max(64),
  token: z.string().min(1).max(128),
})

/**
 * Remove a newsletter subscription.
 *
 * POST only: mail scanners and link previews open every link in an email, so
 * a GET that deleted the row would unsubscribe people who never clicked. The
 * /unsubscribe page shows one button, and that button calls this route.
 */
export async function POST(req: Request) {
  try {
    const csrfValid = await validateCsrfToken(req)
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      )
    }

    const identifier = getIdentifier(req)
    const { success, reset } = await checkStrictRateLimit(identifier)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const body = await req.json()
    const validation = UnsubscribeSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id, token } = validation.data

    if (!verifyUnsubscribeToken(id, token)) {
      return errorResponse(
        "This unsubscribe link is not valid. Use the link from your most recent email.",
        ErrorCodes.BAD_REQUEST,
        undefined,
        400
      )
    }

    // deleteMany, so a second click on the same link is still a success.
    const { count } = await prisma.newsletter.deleteMany({ where: { id } })

    return successResponse(
      { unsubscribed: true, alreadyRemoved: count === 0 },
      { message: "You are unsubscribed." }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
