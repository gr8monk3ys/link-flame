import { getServerAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
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
