import { NextResponse } from "next/server";
import { IMPERFECT_REASONS } from "../route";

/**
 * GET /api/products/imperfect/reasons
 * Returns the list of common imperfect reasons for UI display
 */
export async function GET() {
  return NextResponse.json({
    reasons: IMPERFECT_REASONS,
    message: "Available imperfect reasons for products",
  });
}
