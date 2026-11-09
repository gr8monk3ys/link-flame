import { NextResponse } from "next/server";
import { claimDownload } from "@/lib/digital-downloads";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { errorResponse, rateLimitErrorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const MESSAGES = {
  not_found: "This download link is not valid.",
  not_paid: "This order is not paid, or it was refunded.",
  exhausted:
    "This link has reached its download limit. Reply to your order email and we will send a new one.",
} as const;

/**
 * GET /api/downloads/:token
 *
 * Streams a purchased file. The token comes from the order confirmation
 * page and email; each token allows a fixed number of downloads.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { success, reset } = await checkRateLimit(getIdentifier(req));
  if (!success) return rateLimitErrorResponse(reset);

  const { token } = await params;

  try {
    const claim = await claimDownload(token);
    if (!claim.ok) {
      const status = claim.reason === "not_found" ? 404 : claim.reason === "not_paid" ? 403 : 410;
      return errorResponse(MESSAGES[claim.reason], "DOWNLOAD_UNAVAILABLE", undefined, status);
    }

    const safeName = claim.filename.replace(/[^A-Za-z0-9._-]/g, "_");
    return new NextResponse(Buffer.from(claim.data), {
      status: 200,
      headers: {
        "Content-Type": claim.contentType,
        "Content-Length": String(claim.data.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    logger.error("Download failed", error);
    return errorResponse("Download failed. Please try again.", "DOWNLOAD_FAILED", undefined, 500);
  }
}
