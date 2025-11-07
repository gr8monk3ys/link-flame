import { getServerAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const { userId } = await getServerAuth();

    return NextResponse.json({
      userId: userId || "guest-user",
      isAuthenticated: !!userId
    });
  } catch (error) {
    console.error("[AUTH_USER_ERROR]", error);
    return handleApiError(error);
  }
}
