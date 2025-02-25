import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    return NextResponse.json({ 
      userId: userId || "guest-user",
      isAuthenticated: !!userId
    });
  } catch (error) {
    console.error("[AUTH_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
